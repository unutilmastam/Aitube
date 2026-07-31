import { Prisma } from "@prisma/client";
import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { breakdownScriptIntoScenes } from "./scene-ai";

const SCENE_BREAKDOWN_COST = 1; // credit

export async function generateScenesForScript(userId: string, scriptId: string) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true },
  });

  if (!script) throw new NotFoundError("Ssenariy topilmadi");
  if (script.project.userId !== userId) {
    throw new ForbiddenError("Bu ssenariyga ruxsatingiz yo'q");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.credits < SCENE_BREAKDOWN_COST) {
    throw new AppError("Kreditingiz yetarli emas. Iltimos, hisobingizni to'ldiring.", 402);
  }

  const generated = await breakdownScriptIntoScenes({
    scriptContent: script.content,
    niche: script.project.niche,
    language: script.project.language,
  });

  // Eski sahnalarni tozalab, yangilarini yozamiz (transaction ichida — yarim yozilib qolmasligi uchun)
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.scene.deleteMany({ where: { scriptId } });

    const scenes = await Promise.all(
      generated.map((scene, index) =>
        tx.scene.create({
          data: {
            scriptId,
            order: index + 1,
            narration: scene.narration,
            visualPrompt: scene.visualPrompt,
            cameraMotion: scene.cameraMotion,
            transition: scene.transition,
            durationSec: scene.durationSec,
          },
        })
      )
    );

    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: SCENE_BREAKDOWN_COST } },
    });

    await tx.project.update({
      where: { id: script.projectId },
      data: { status: "SCENES_READY" },
    });

    return scenes;
  });

  return result;
}

export async function listScenesForScript(userId: string, scriptId: string) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true },
  });

  if (!script) throw new NotFoundError("Ssenariy topilmadi");
  if (script.project.userId !== userId) {
    throw new ForbiddenError("Bu ssenariyga ruxsatingiz yo'q");
  }

  return prisma.scene.findMany({
    where: { scriptId },
    orderBy: { order: "asc" },
  });
}

export async function updateScene(
  userId: string,
  sceneId: string,
  data: Partial<{
    narration: string;
    visualPrompt: string;
    cameraMotion: string;
    durationSec: number;
  }>
) {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: { script: { include: { project: true } } },
  });

  if (!scene) throw new NotFoundError("Sahna topilmadi");
  if (scene.script.project.userId !== userId) {
    throw new ForbiddenError("Bu sahnaga ruxsatingiz yo'q");
  }

  return prisma.scene.update({ where: { id: sceneId }, data });
}
