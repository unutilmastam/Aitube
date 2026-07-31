import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { generateVisual } from "./visual-ai";

const VISUAL_GENERATION_COST = 2; // credit — vizual generatsiya eng qimmat qism

export async function generateVisualForScene(userId: string, sceneId: string) {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: { script: { include: { project: true } } },
  });

  if (!scene) throw new NotFoundError("Sahna topilmadi");
  if (scene.script.project.userId !== userId) {
    throw new ForbiddenError("Bu sahnaga ruxsatingiz yo'q");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.credits < VISUAL_GENERATION_COST) {
    throw new AppError("Kreditingiz yetarli emas. Iltimos, hisobingizni to'ldiring.", 402);
  }

  const fileUrl = await generateVisual({
    visualPrompt: scene.visualPrompt,
    sceneId: scene.id,
    aspectRatio: "portrait",
  });

  const [updated] = await prisma.$transaction([
    prisma.scene.update({ where: { id: sceneId }, data: { visualFileUrl: fileUrl } }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: VISUAL_GENERATION_COST } },
    }),
  ]);

  return updated;
}

// Eslatma: bir nechta sahnani parallel emas, ketma-ket generatsiya qilamiz —
// AI provayderlarning rate-limit'iga tegib qolmaslik uchun.
export async function generateVisualsForAllScenes(userId: string, scriptId: string) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true, scenes: { orderBy: { order: "asc" } } },
  });

  if (!script) throw new NotFoundError("Ssenariy topilmadi");
  if (script.project.userId !== userId) {
    throw new ForbiddenError("Bu ssenariyga ruxsatingiz yo'q");
  }
  if (script.scenes.length === 0) {
    throw new AppError("Avval sahnalarni generatsiya qiling", 400);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const totalCost = script.scenes.length * VISUAL_GENERATION_COST;
  if (user.credits < totalCost) {
    throw new AppError(
      `Kreditingiz yetarli emas. Kerak: ${totalCost}, mavjud: ${user.credits}.`,
      402
    );
  }

  const results = [];
  for (const scene of script.scenes) {
    const fileUrl = await generateVisual({
      visualPrompt: scene.visualPrompt,
      sceneId: scene.id,
      aspectRatio: "portrait",
    });
    results.push(await prisma.scene.update({ where: { id: scene.id }, data: { visualFileUrl: fileUrl } }));
  }

  await prisma.user.update({ where: { id: userId }, data: { credits: { decrement: totalCost } } });

  return results;
}
