import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { uploadQueue } from "@/infra/queue/upload.queue";

interface CreateUploadJobParams {
  projectId: string;
  youtubeAccountId: string;
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  scheduledAt?: Date;
}

export async function createUploadJob(userId: string, params: CreateUploadJobParams) {
  const { projectId, youtubeAccountId, visibility, scheduledAt } = params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      renderJobs: { where: { status: "DONE" }, orderBy: { createdAt: "desc" }, take: 1 },
      thumbnails: { where: { isSelected: true }, take: 1 },
      seoMeta: true,
    },
  });

  if (!project) throw new NotFoundError("Loyiha topilmadi");
  if (project.userId !== userId) throw new ForbiddenError("Bu loyihaga ruxsatingiz yo'q");

  if (project.renderJobs.length === 0) {
    throw new AppError("Video hali render qilinmagan. Avval render jarayonini tugating.", 400);
  }
  if (!project.seoMeta) {
    throw new AppError("SEO ma'lumotlari hali yaratilmagan.", 400);
  }

  const youtubeAccount = await prisma.youtubeAccount.findUnique({
    where: { id: youtubeAccountId },
  });
  if (!youtubeAccount || youtubeAccount.userId !== userId) {
    throw new ForbiddenError("Bu YouTube kanaliga ruxsatingiz yo'q");
  }

  const isScheduled = scheduledAt && scheduledAt.getTime() > Date.now();

  const uploadJob = await prisma.uploadJob.create({
    data: {
      projectId,
      youtubeAccountId,
      visibility,
      scheduledAt: scheduledAt ?? null,
      status: isScheduled ? "SCHEDULED" : "PENDING",
    },
  });

  if (!isScheduled) {
    // Darhol yuklash — navbatga qo'shamiz
    await uploadQueue.add("upload-video", { uploadJobId: uploadJob.id });
  }
  // Agar isScheduled bo'lsa — worker'dagi cron job navbat vaqti kelganda o'zi navbatga qo'shadi

  return uploadJob;
}

export async function getUploadJobStatus(userId: string, uploadJobId: string) {
  const job = await prisma.uploadJob.findUnique({
    where: { id: uploadJobId },
    include: { project: true },
  });

  if (!job) throw new NotFoundError("Upload job topilmadi");
  if (job.project.userId !== userId) throw new ForbiddenError("Bu job'ga ruxsatingiz yo'q");

  return job;
}

export async function cancelUploadJob(userId: string, uploadJobId: string) {
  const job = await prisma.uploadJob.findUnique({
    where: { id: uploadJobId },
    include: { project: true },
  });

  if (!job) throw new NotFoundError("Upload job topilmadi");
  if (job.project.userId !== userId) throw new ForbiddenError("Bu job'ga ruxsatingiz yo'q");
  if (job.status === "DONE" || job.status === "UPLOADING") {
    throw new AppError("Bu holatdagi job'ni bekor qilib bo'lmaydi", 400);
  }

  return prisma.uploadJob.update({ where: { id: uploadJobId }, data: { status: "FAILED", errorLog: "Foydalanuvchi tomonidan bekor qilindi" } });
}
