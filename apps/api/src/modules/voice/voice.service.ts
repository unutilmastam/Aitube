import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { synthesizeVoice } from "./tts-provider";

const VOICE_GENERATION_COST = 1; // credit, har sahna uchun

export async function generateVoiceForScene(userId: string, sceneId: string) {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: { script: { include: { project: true } } },
  });

  if (!scene) throw new NotFoundError("Sahna topilmadi");
  if (scene.script.project.userId !== userId) {
    throw new ForbiddenError("Bu sahnaga ruxsatingiz yo'q");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.credits < VOICE_GENERATION_COST) {
    throw new AppError("Kreditingiz yetarli emas. Iltimos, hisobingizni to'ldiring.", 402);
  }

  const { fileUrl, durationSec } = await synthesizeVoice({
    text: scene.narration,
    sceneId: scene.id,
  });

  const [updated] = await prisma.$transaction([
    prisma.scene.update({
      where: { id: sceneId },
      data: { audioFileUrl: fileUrl, audioDuration: durationSec },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: VOICE_GENERATION_COST } },
    }),
  ]);

  return updated;
}

// Butun ssenariy uchun barcha sahnalarga ketma-ket ovoz yaratadi.
// Eslatma: Phase 3'da bu Redis/BullMQ queue orqali background job bo'lib qayta yoziladi,
// hozircha sinov uchun sinxron (ketma-ket) ishlaydi.
export async function generateVoiceForAllScenes(userId: string, scriptId: string) {
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
  const totalCost = script.scenes.length * VOICE_GENERATION_COST;
  if (user.credits < totalCost) {
    throw new AppError(
      `Kreditingiz yetarli emas. Kerak: ${totalCost}, mavjud: ${user.credits}.`,
      402
    );
  }

  const results = [];
  for (const scene of script.scenes) {
    const { fileUrl, durationSec } = await synthesizeVoice({
      text: scene.narration,
      sceneId: scene.id,
    });
    const updated = await prisma.scene.update({
      where: { id: scene.id },
      data: { audioFileUrl: fileUrl, audioDuration: durationSec },
    });
    results.push(updated);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: totalCost } },
  });
  await prisma.project.update({
    where: { id: script.projectId },
    data: { status: "VOICE_READY" },
  });

  return results;
}
