import fs from "fs/promises";
import path from "path";
import os from "os";
import { Job } from "bullmq";
import { prisma } from "@/infra/prisma";
import { downloadToPath, uploadFromPath } from "@/infra/minio";
import { composeVideo, cleanupWorkDir } from "./ffmpeg-composer";
import { logger } from "@/infra/logger";

interface RenderJobPayload {
  renderJobId: string;
  scriptId: string;
  projectId: string;
}

export async function processRenderJob(job: Job<RenderJobPayload>): Promise<void> {
  const { renderJobId, scriptId, projectId } = job.data;

  await prisma.renderJob.update({
    where: { id: renderJobId },
    data: { status: "PROCESSING", progress: 5 },
  });

  const scenes = await prisma.scene.findMany({
    where: { scriptId },
    orderBy: { order: "asc" },
  });

  const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "assets-"));

  try {
    // 1. Barcha sahna fayllarini (audio + vizual) MinIO'dan lokal diskga tortib olamiz
    const sceneInputs = [];
    for (const scene of scenes) {
      if (!scene.audioFileUrl || !scene.visualFileUrl) {
        throw new Error(`Sahna ${scene.order} uchun audio yoki vizual mavjud emas`);
      }

      const imagePath = path.join(downloadDir, `scene-${scene.order}.png`);
      const audioPath = path.join(downloadDir, `scene-${scene.order}.mp3`);

      await downloadToPath(scene.visualFileUrl, imagePath);
      await downloadToPath(scene.audioFileUrl, audioPath);

      sceneInputs.push({
        order: scene.order,
        imagePath,
        audioPath,
        narration: scene.narration,
        durationSec: scene.audioDuration || scene.durationSec,
      });
    }

    await prisma.renderJob.update({ where: { id: renderJobId }, data: { progress: 10 } });

    // 2. FFmpeg orqali montaj
    const finalOutputPath = await composeVideo(sceneInputs, async (percent) => {
      await prisma.renderJob.update({ where: { id: renderJobId }, data: { progress: percent } });
    });

    // 3. Tayyor videoni MinIO'ga qaytarib yuklaymiz
    const objectKey = `output/${projectId}-${Date.now()}.mp4`;
    const outputUrl = await uploadFromPath(objectKey, finalOutputPath, "video/mp4");

    await prisma.$transaction([
      prisma.renderJob.update({
        where: { id: renderJobId },
        data: { status: "DONE", progress: 100, outputFileUrl: outputUrl },
      }),
      prisma.project.update({ where: { id: projectId }, data: { status: "DONE" } }),
    ]);

    await cleanupWorkDir(finalOutputPath);
    logger.info(`Render tugadi: ${renderJobId} -> ${outputUrl}`);
  } catch (err) {
    const error = err as Error;
    logger.error(`Render xato: ${renderJobId}`, { error: error.message });

    await prisma.$transaction([
      prisma.renderJob.update({
        where: { id: renderJobId },
        data: { status: "FAILED", errorLog: error.message },
      }),
      prisma.project.update({ where: { id: projectId }, data: { status: "FAILED" } }),
    ]);

    throw err; // BullMQ retry mexanizmi ishlashi uchun qayta tashlaymiz
  } finally {
    await fs.rm(downloadDir, { recursive: true, force: true }).catch(() => {});
  }
}
