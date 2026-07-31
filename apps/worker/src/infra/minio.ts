import { Client } from "minio";
import { logger } from "./logger";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "platform_admin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "platform_secret",
});

const BUCKET = process.env.MINIO_BUCKET || "platform-media";

export function extractObjectKey(fileUrl: string): string {
  // fileUrl shakli: http://minio:9000/platform-media/voice/xxx.mp3
  const parts = fileUrl.split(`/${BUCKET}/`);
  return parts[1] || fileUrl;
}

export async function downloadToPath(fileUrl: string, destPath: string): Promise<void> {
  const objectKey = extractObjectKey(fileUrl);
  await minioClient.fGetObject(BUCKET, objectKey, destPath);
}

export async function uploadFromPath(objectKey: string, filePath: string, contentType: string): Promise<string> {
  await minioClient.fPutObject(BUCKET, objectKey, filePath, { "Content-Type": contentType });
  const publicBase = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
  const url = `${publicBase}/${BUCKET}/${objectKey}`;
  logger.info(`Fayl yuklandi: ${url}`);
  return url;
}
