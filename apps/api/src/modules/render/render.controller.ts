import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@/shared/errors/AppError";
import * as visualService from "@/modules/visuals/visual.service";
import * as renderService from "@/modules/render/render.service";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.userId;
}

export async function generateSceneVisualHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const scene = await visualService.generateVisualForScene(userId, req.params.sceneId);
    res.status(200).json({ success: true, data: scene });
  } catch (err) {
    next(err);
  }
}

export async function generateAllVisualsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const scenes = await visualService.generateVisualsForAllScenes(userId, req.params.scriptId);
    res.status(200).json({ success: true, data: scenes });
  } catch (err) {
    next(err);
  }
}

export async function startRenderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const job = await renderService.startRender(userId, req.params.scriptId);
    res.status(202).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

export async function getRenderStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const job = await renderService.getRenderStatus(userId, req.params.renderJobId);
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}
