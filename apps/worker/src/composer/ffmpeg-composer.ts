import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { logger } from "@/infra/logger";

interface SceneInput {
  order: number;
  imagePath: string;
  audioPath: string;
  narration: string;
  durationSec: number;
}

// Har bir sahna uchun: statik rasmni audio davomiyligiga moslab, ken-berns (sekin zoom) effekti bilan videoga aylantiradi
function buildSceneVideo(scene: SceneInput, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(scene.imagePath)
      .loop(scene.durationSec)
      .input(scene.audioPath)
      .videoFilters([
        // 720x1280 portrait (Shorts) uchun, sekin zoom-in effekti
        `scale=1280:2276,zoompan=z='min(zoom+0.0008,1.15)':d=${Math.round(
          scene.durationSec * 30
        )}:s=720x1280:fps=30`,
      ])
      .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-c:a aac", "-shortest"])
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputPath);
  });
}

// Har bir sahna video segmentiga subtitr (narration matni) pastki qismga yopishtiriladi
function burnSubtitle(inputPath: string, text: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // FFmpeg drawtext filtri uchun maxsus belgilarni escape qilamiz
    const safeText = text.replace(/'/g, "\u2019").replace(/:/g, "\\:").replace(/,/g, "\\,");

    ffmpeg()
      .input(inputPath)
      .videoFilters([
        {
          filter: "drawtext",
          options: {
            text: safeText,
            fontcolor: "white",
            fontsize: 42,
            box: 1,
            boxcolor: "black@0.5",
            boxborderw: 12,
            x: "(w-text_w)/2",
            y: "h-th-120",
            line_spacing: 8,
          },
        },
      ])
      .outputOptions(["-c:a copy"])
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputPath);
  });
}

function concatVideos(segmentPaths: string[], outputPath: string, listFilePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFilePath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputPath);
  });
}

export async function composeVideo(
  scenes: SceneInput[],
  onProgress?: (percent: number) => Promise<void>
): Promise<string> {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "render-"));
  const segmentPaths: string[] = [];

  try {
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const rawSegment = path.join(workDir, `scene-${scene.order}-raw.mp4`);
      const subtitledSegment = path.join(workDir, `scene-${scene.order}-final.mp4`);

      logger.info(`Sahna ${scene.order}/${scenes.length} render qilinmoqda...`);
      await buildSceneVideo(scene, rawSegment);
      await burnSubtitle(rawSegment, scene.narration, subtitledSegment);

      segmentPaths.push(subtitledSegment);

      if (onProgress) {
        // Vizual+audio tayyor, endi montaj bosqichi — progress'ni 10% dan 90% gacha taqsimlaymiz
        const percent = 10 + Math.round(((i + 1) / scenes.length) * 70);
        await onProgress(percent);
      }
    }

    const listFilePath = path.join(workDir, "concat-list.txt");
    const listContent = segmentPaths.map((p) => `file '${p}'`).join("\n");
    await fs.writeFile(listFilePath, listContent);

    const finalOutputPath = path.join(workDir, "final-output.mp4");
    await concatVideos(segmentPaths, finalOutputPath, listFilePath);

    if (onProgress) await onProgress(95);

    return finalOutputPath;
  } catch (err) {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

export async function cleanupWorkDir(finalOutputPath: string): Promise<void> {
  const workDir = path.dirname(finalOutputPath);
  await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
}
