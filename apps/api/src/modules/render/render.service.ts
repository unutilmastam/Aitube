import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { renderQueue } from "@/infra/queue/render.queue";

export async function startRender(userId: string, scriptId: string) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true, scenes: true },
  });

  if (!script) throw new NotFoundError("Ssenariy topilmadi");
  if (script.project.userId !== userId) {
    throw new ForbiddenError("Bu ssenariyga ruxsatingiz yo'q");
  }

  if (script.scenes.length === 0) {
    throw new AppError("Avval sahnalarni generatsiya qiling", 400);
  }

  const missingAudio = script.scenes.some((s: { audioFileUrl: string | null }) => !s.audioFileUrl);
  const missingVisual = script.scenes.some((s: { visualFileUrl: string | null }) => !s.visualFileUrl);
  if (missingAudio || missingVisual) {
    throw new AppError(
      "Barcha sahnalar uchun ovoz va vizual tayyor bo'lishi kerak, keyin render qiling",
      400
    );
  }

  const renderJob = await prisma.renderJob.create({
    data: {
      projectId: script.projectId,
      scriptId: script.id,
      status: "QUEUED",
    },
  });

  await prisma.project.update({
    where: { id: script.projectId },
    data: { status: "RENDERING" },
  });

  await renderQueue.add("compose-video", {
    renderJobId: renderJob.id,
    scriptId: script.id,
    projectId: script.projectId,
  });

  return renderJob;
}

export async function getRenderStatus(userId: string, renderJobId: string) {
  const job = await prisma.renderJob.findUnique({
    where: { id: renderJobId },
    include: { project: true },
  });

  if (!job) throw new NotFoundError("Render job topilmadi");
  if (job.project.userId !== userId) {
    throw new ForbiddenError("Bu job'ga ruxsatingiz yo'q");
  }

  return job;
}
