import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError } from "@/shared/errors/AppError";
import { getProjectOrThrow } from "@/modules/projects/project.service";
import { generateScript } from "./ai-provider";

const SCRIPT_GENERATION_COST = 1; // credit

export async function createScriptForProject(
  userId: string,
  projectId: string,
  topic: string,
  targetDurationSeconds?: number
) {
  const project = await getProjectOrThrow(userId, projectId);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.credits < SCRIPT_GENERATION_COST) {
    throw new AppError(
      "Kreditingiz yetarli emas. Iltimos, hisobingizni to'ldiring.",
      402
    );
  }

  const content = await generateScript({
    topic,
    niche: project.niche,
    language: project.language,
    targetDurationSeconds,
  });

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const lastVersion = project.scripts[0]?.version ?? 0;

  const [script] = await prisma.$transaction([
    prisma.script.create({
      data: {
        projectId,
        content,
        wordCount,
        generatedByModel: "gpt-4o-mini",
        version: lastVersion + 1,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: SCRIPT_GENERATION_COST } },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { status: "SCRIPT_READY" },
    }),
  ]);

  return script;
}

export async function updateScriptContent(
  userId: string,
  scriptId: string,
  content: string
) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true },
  });

  if (!script) throw new NotFoundError("Ssenariy topilmadi");
  if (script.project.userId !== userId) {
    throw new AppError("Bu ssenariyni tahrirlashga ruxsatingiz yo'q", 403);
  }

  return prisma.script.update({
    where: { id: scriptId },
    data: { content, wordCount: content.split(/\s+/).filter(Boolean).length },
  });
}
