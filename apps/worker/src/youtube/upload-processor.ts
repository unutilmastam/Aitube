import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { Job } from "bullmq";
import { google } from "googleapis";
import { prisma } from "@/infra/prisma";
import { downloadToPath } from "@/infra/minio";
import { decrypt, encrypt } from "@/infra/crypto";
import { logger } from "@/infra/logger";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

interface UploadJobPayload {
  uploadJobId: string;
}

export async function processUploadJob(job: Job<UploadJobPayload>): Promise<void> {
  const { uploadJobId } = job.data;

  await prisma.uploadJob.update({ where: { id: uploadJobId }, data: { status: "UPLOADING" } });

  const uploadJob = await prisma.uploadJob.findUniqueOrThrow({
    where: { id: uploadJobId },
    include: {
      project: {
        include: {
          renderJobs: { where: { status: "DONE" }, orderBy: { createdAt: "desc" }, take: 1 },
          thumbnails: { where: { isSelected: true }, take: 1 },
          seoMeta: true,
        },
      },
      youtubeAccount: true,
    },
  });

  const { project, youtubeAccount } = uploadJob;
  const renderJob = project.renderJobs[0];
  const thumbnail = project.thumbnails[0];
  const seo = project.seoMeta;

  if (!renderJob?.outputFileUrl || !seo) {
    throw new Error("Video yoki SEO ma'lumotlari topilmadi — upload bekor qilindi");
  }

  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), "upload-"));

  try {
    // 1. OAuth mijozini tayyorlash (kerak bo'lsa avtomatik refresh qiladi)
    const oauthClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauthClient.setCredentials({
      access_token: decrypt(youtubeAccount.accessTokenEncrypted),
      refresh_token: decrypt(youtubeAccount.refreshTokenEncrypted),
      expiry_date: youtubeAccount.tokenExpiresAt.getTime(),
    });

    oauthClient.on("tokens", async (tokens) => {
      // googleapis token'ni o'zi yangilasa, DB'ga qayta yozamiz
      if (tokens.access_token && tokens.expiry_date) {
        await prisma.youtubeAccount.update({
          where: { id: youtubeAccount.id },
          data: {
            accessTokenEncrypted: encrypt(tokens.access_token),
            tokenExpiresAt: new Date(tokens.expiry_date),
          },
        });
      }
    });

    const youtube = google.youtube({ version: "v3", auth: oauthClient });

    // 2. Video va thumbnail fayllarini lokal diskka tortib olish
    const videoPath = path.join(workDir, "video.mp4");
    await downloadToPath(renderJob.outputFileUrl, videoPath);

    // 3. YouTube'ga resumable upload
    logger.info(`YouTube'ga yuklanmoqda: ${uploadJobId}`);
    const insertRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: seo.title,
          description: seo.description,
          tags: seo.tags,
          categoryId: "27", // Education — niche'ga qarab keyinchalik moslashtiriladi
        },
        status: {
          privacyStatus: uploadJob.visibility.toLowerCase() as "private" | "unlisted" | "public",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    const youtubeVideoId = insertRes.data.id;
    if (!youtubeVideoId) {
      throw new Error("YouTube video ID qaytarmadi");
    }

    // 4. Thumbnail o'rnatish (agar tanlangan bo'lsa)
    if (thumbnail) {
      const thumbPath = path.join(workDir, "thumbnail.png");
      await downloadToPath(thumbnail.imageUrl, thumbPath);
      await youtube.thumbnails.set({
        videoId: youtubeVideoId,
        media: { body: fs.createReadStream(thumbPath) },
      });
    }

    await prisma.$transaction([
      prisma.uploadJob.update({
        where: { id: uploadJobId },
        data: { status: "DONE", youtubeVideoId },
      }),
    ]);

    logger.info(`Upload tugadi: ${uploadJobId} -> https://youtube.com/watch?v=${youtubeVideoId}`);
  } catch (err) {
    const error = err as Error;
    logger.error(`Upload xato: ${uploadJobId}`, { error: error.message });
    await prisma.uploadJob.update({
      where: { id: uploadJobId },
      data: { status: "FAILED", errorLog: error.message },
    });
    throw err;
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
