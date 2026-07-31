import { prisma } from "@/infra/prisma/client";
import { NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { CreateProjectInput } from "./project.validators";

export async function createProject(userId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      userId,
      title: input.title,
      niche: input.niche,
      language: input.language,
    },
  });
}

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { scripts: { orderBy: { version: "desc" }, take: 1 } },
  });
}

export async function getProjectOrThrow(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { scripts: { orderBy: { version: "desc" } } },
  });

  if (!project) throw new NotFoundError("Loyiha topilmadi");
  if (project.userId !== userId) throw new ForbiddenError("Bu loyihaga ruxsatingiz yo'q");

  return project;
}
