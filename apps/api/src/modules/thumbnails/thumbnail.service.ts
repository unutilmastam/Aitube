import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { generateThumbnailConcept, generateThumbnailImage } from "./thumbnail-ai";

const THUMBNAIL_GENERATION_COST = 3; // credit — 3 ta variant birga generatsiya qilinadi
const VARIANT_COUNT = 3;

export async function generateThumbnails(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { scripts: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!project) throw new NotFoundError("Loyiha topilmadi");
  if (project.userId !== userId) throw new ForbiddenError("Bu loyihaga ruxsatingiz yo'q");

  const latestScript = project.scripts[0];
  if (!latestScript) {
    throw new AppError("Avval skript generatsiya qiling", 400);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.credits < THUMBNAIL_GENERATION_COST) {
    throw new AppError("Kreditingiz yetarli emas. Iltimos, hisobingizni to'ldiring.", 402);
  }

  const concept = await generateThumbnailConcept(latestScript.content, project.title);

  const thumbnails = [];
  for (let variant = 1; variant <= VARIANT_COUNT; variant++) {
    const imageUrl = await generateThumbnailImage(
      concept.visualDescription,
      concept.headline,
      projectId,
      variant
    );
    thumbnails.push(
      await prisma.thumbnail.create({
        data: { projectId, imageUrl, variant, headline: concept.headline },
      })
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: THUMBNAIL_GENERATION_COST } },
  });

  return thumbnails;
}

export async function listThumbnails(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError("Loyiha topilmadi");
  if (project.userId !== userId) throw new ForbiddenError("Bu loyihaga ruxsatingiz yo'q");

  return prisma.thumbnail.findMany({ where: { projectId }, orderBy: { variant: "asc" } });
}

export async function selectThumbnail(userId: string, thumbnailId: string) {
  const thumbnail = await prisma.thumbnail.findUnique({
    where: { id: thumbnailId },
    include: { project: true },
  });

  if (!thumbnail) throw new NotFoundError("Thumbnail topilmadi");
  if (thumbnail.project.userId !== userId) {
    throw new ForbiddenError("Bu thumbnail'ga ruxsatingiz yo'q");
  }

  await prisma.$transaction([
    prisma.thumbnail.updateMany({
      where: { projectId: thumbnail.projectId },
      data: { isSelected: false },
    }),
    prisma.thumbnail.update({ where: { id: thumbnailId }, data: { isSelected: true } }),
  ]);

  return prisma.thumbnail.findUnique({ where: { id: thumbnailId } });
}
