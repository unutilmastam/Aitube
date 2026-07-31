import { Client } from "minio";
import { logger } from "@/shared/logger";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "platform_admin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "platform_secret",
});

const BUCKET = process.env.MINIO_BUCKET || "platform-media";

let bucketEnsured = false;

async function ensureBucket() {
  if (bucketEnsured) return;
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    logger.info(`MinIO bucket yaratildi: ${BUCKET}`);
  }
  bucketEnsured = true;
}

export async function uploadBuffer(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket();

  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    "Content-Type": contentType,
  });

  const publicBase = process.env.MINIO_PUBLIC_URL || `http://localhost:9000`;
  return `${publicBase}/${BUCKET}/${objectKey}`;
}

export async function getPresignedUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
  await ensureBucket();
  return minioClient.presignedGetObject(BUCKET, objectKey, expirySeconds);
}
