import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as projectService from "./project.service";
import * as scriptService from "@/modules/scripts/script.service";
import { createProjectSchema } from "./project.validators";
import { UnauthorizedError } from "@/shared/errors/AppError";

const generateScriptBodySchema = z.object({
  topic: z.string().min(3, "Mavzu kamida 3 belgi bo'lishi kerak"),
  targetDurationSeconds: z.number().int().min(30).max(1800).optional(),
});

const updateScriptBodySchema = z.object({
  content: z.string().min(10, "Matn juda qisqa"),
});

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.userId;
}

export async function createProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const input = createProjectSchema.parse(req.body);
    const project = await projectService.createProject(userId, input);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function listProjectsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const projects = await projectService.listProjects(userId);
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

export async function getProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const project = await projectService.getProjectOrThrow(userId, req.params.id);
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function generateScriptHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { topic, targetDurationSeconds } = generateScriptBodySchema.parse(req.body);
    const script = await scriptService.createScriptForProject(
      userId,
      req.params.id,
      topic,
      targetDurationSeconds
    );
    res.status(201).json({ success: true, data: script });
  } catch (err) {
    next(err);
  }
}

export async function updateScriptHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { content } = updateScriptBodySchema.parse(req.body);
    const script = await scriptService.updateScriptContent(userId, req.params.scriptId, content);
    res.status(200).json({ success: true, data: script });
  } catch (err) {
    next(err);
  }
}
