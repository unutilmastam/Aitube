import { Queue } from "bullmq";
import IORedis from "ioredis";

export const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // BullMQ talabi
});

export const RENDER_QUEUE_NAME = "video-render";

export const renderQueue = new Queue(RENDER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export interface RenderJobPayload {
  renderJobId: string;
  scriptId: string;
  projectId: string;
}
