import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { generateSeoMeta } from "./seo-ai";

const SEO_GENERATION_COST = 1; // credit

export async function generateSeoForProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scripts: {
        orderBy: { version: "desc" },
        take: 1,
        include: { scenes: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!project) throw new NotFoundError("Loyiha topilmadi");
  if (project.userId !== userId) throw new ForbiddenError("Bu loyihaga ruxsatingiz yo'q");

  const latestScript = project.scripts[0];
  if (!latestScript) {
    throw new AppError("Avval skript generatsiya qiling", 400);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.credits < SEO_GENERATION_COST) {
    throw new AppError("Kreditingiz yetarli emas. Iltimos, hisobingizni to'ldiring.", 402);
  }

  const seo = await generateSeoMeta({
    scriptContent: latestScript.content,
    projectTitle: project.title,
    niche: project.niche,
    language: project.language,
    scenes: latestScript.scenes.map((s: { order: number; narration: string; durationSec: number }) => ({
      order: s.order,
      narration: s.narration,
      durationSec: s.durationSec,
    })),
  });

  const [saved] = await prisma.$transaction([
    prisma.seoMeta.upsert({
      where: { projectId },
      create: {
        projectId,
        title: seo.title,
        description: seo.description,
        tags: seo.tags,
        hashtags: seo.hashtags,
        chapters: seo.chapters ?? [],
      },
      update: {
        title: seo.title,
        description: seo.description,
        tags: seo.tags,
        hashtags: seo.hashtags,
        chapters: seo.chapters ?? [],
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: SEO_GENERATION_COST } },
    }),
  ]);

  return saved;
}

export async function getSeoForProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError("Loyiha topilmadi");
  if (project.userId !== userId) throw new ForbiddenError("Bu loyihaga ruxsatingiz yo'q");

  const seo = await prisma.seoMeta.findUnique({ where: { projectId } });
  if (!seo) throw new NotFoundError("SEO ma'lumotlari hali yaratilmagan");
  return seo;
}
