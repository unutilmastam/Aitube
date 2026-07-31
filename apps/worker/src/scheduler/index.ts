import { Queue } from "bullmq";
import { prisma } from "@/infra/prisma";
import { logger } from "@/infra/logger";

const POLL_INTERVAL_MS = 60_000; // har daqiqada tekshiradi

export function startScheduler(uploadQueue: Queue) {
  logger.info("Scheduler ishga tushdi — rejalashtirilgan yuklashlarni har daqiqada tekshiradi");

  const tick = async () => {
    try {
      const dueJobs = await prisma.uploadJob.findMany({
        where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      });

      for (const job of dueJobs) {
        await prisma.uploadJob.update({ where: { id: job.id }, data: { status: "PENDING" } });
        await uploadQueue.add("upload-video", { uploadJobId: job.id });
        logger.info(`Rejalashtirilgan upload navbatga qo'shildi: ${job.id}`);
      }
    } catch (err) {
      logger.error("Scheduler xatosi", { error: (err as Error).message });
    }
  };

  const interval = setInterval(tick, POLL_INTERVAL_MS);
  tick(); // darhol birinchi tekshiruv

  return () => clearInterval(interval);
}
