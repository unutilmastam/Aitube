import { Queue } from "bullmq";
import { redisConnection } from "./render.queue";

export const UPLOAD_QUEUE_NAME = "youtube-upload";

export const uploadQueue = new Queue(UPLOAD_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export interface UploadJobPayload {
  uploadJobId: string;
}
