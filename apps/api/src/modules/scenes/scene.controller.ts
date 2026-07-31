import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "@/shared/errors/AppError";
import * as sceneService from "@/modules/scenes/scene.service";
import * as voiceService from "@/modules/voice/voice.service";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.userId;
}

const updateSceneSchema = z.object({
  narration: z.string().min(1).optional(),
  visualPrompt: z.string().min(1).optional(),
  cameraMotion: z.enum(["static", "pan-left", "pan-right", "zoom-in", "zoom-out"]).optional(),
  durationSec: z.number().min(2).max(30).optional(),
});

export async function generateScenesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const scenes = await sceneService.generateScenesForScript(userId, req.params.scriptId);
    res.status(201).json({ success: true, data: scenes });
  } catch (err) {
    next(err);
  }
}

export async function listScenesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const scenes = await sceneService.listScenesForScript(userId, req.params.scriptId);
    res.status(200).json({ success: true, data: scenes });
  } catch (err) {
    next(err);
  }
}

export async function updateSceneHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const input = updateSceneSchema.parse(req.body);
    const scene = await sceneService.updateScene(userId, req.params.sceneId, input);
    res.status(200).json({ success: true, data: scene });
  } catch (err) {
    next(err);
  }
}

export async function generateSceneVoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const scene = await voiceService.generateVoiceForScene(userId, req.params.sceneId);
    res.status(200).json({ success: true, data: scene });
  } catch (err) {
    next(err);
  }
}

export async function generateAllVoicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const scenes = await voiceService.generateVoiceForAllScenes(userId, req.params.scriptId);
    res.status(200).json({ success: true, data: scenes });
  } catch (err) {
    next(err);
  }
}
