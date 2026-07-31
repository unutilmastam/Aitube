import "dotenv/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@/infra/logger";
import { processRenderJob } from "@/composer/render-processor";
import { processUploadJob } from "@/youtube/upload-processor";
import { startScheduler } from "@/scheduler";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// --- Video render worker ---
const renderWorker = new Worker("video-render", processRenderJob, {
  connection,
  concurrency: 1, // FFmpeg CPU-og'ir, VPS resurslariga qarab oshiriladi
});

renderWorker.on("completed", (job) => logger.info(`Render tugadi: ${job.id}`));
renderWorker.on("failed", (job, err) => logger.error(`Render xato: ${job?.id}`, { error: err.message }));

// --- YouTube upload worker ---
const uploadWorker = new Worker("youtube-upload", processUploadJob, {
  connection,
  concurrency: 2, // upload asosan I/O-bound, bir nechtasi parallel bo'lishi mumkin
});

uploadWorker.on("completed", (job) => logger.info(`Upload tugadi: ${job.id}`));
uploadWorker.on("failed", (job, err) => logger.error(`Upload xato: ${job?.id}`, { error: err.message }));

// --- Scheduler (rejalashtirilgan yuklashlar) ---
const uploadQueue = new Queue("youtube-upload", { connection });
const stopScheduler = startScheduler(uploadQueue);

logger.info("Worker ishga tushdi: render + upload + scheduler faol");

process.on("SIGTERM", async () => {
  stopScheduler();
  await Promise.all([renderWorker.close(), uploadWorker.close()]);
  process.exit(0);
});
