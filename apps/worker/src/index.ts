import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@/infra/logger";
import { processRenderJob } from "@/composer/render-processor";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker("video-render", processRenderJob, {
  connection,
  concurrency: 1, // FFmpeg CPU-og'ir jarayon, VPS resurslariga qarab oshiriladi
});

worker.on("completed", (job) => {
  logger.info(`Job bajarildi: ${job.id}`);
});

worker.on("failed", (job, err) => {
  logger.error(`Job muvaffaqiyatsiz: ${job?.id}`, { error: err.message });
});

logger.info("Render worker ishga tushdi, navbatni kutmoqda...");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
