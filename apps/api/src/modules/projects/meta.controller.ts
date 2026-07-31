import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@/shared/errors/AppError";
import * as thumbnailService from "@/modules/thumbnails/thumbnail.service";
import * as seoService from "@/modules/seo/seo.service";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.userId;
}

export async function generateThumbnailsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const thumbnails = await thumbnailService.generateThumbnails(userId, req.params.id);
    res.status(201).json({ success: true, data: thumbnails });
  } catch (err) {
    next(err);
  }
}

export async function listThumbnailsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const thumbnails = await thumbnailService.listThumbnails(userId, req.params.id);
    res.status(200).json({ success: true, data: thumbnails });
  } catch (err) {
    next(err);
  }
}

export async function selectThumbnailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const thumbnail = await thumbnailService.selectThumbnail(userId, req.params.thumbnailId);
    res.status(200).json({ success: true, data: thumbnail });
  } catch (err) {
    next(err);
  }
}

export async function generateSeoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const seo = await seoService.generateSeoForProject(userId, req.params.id);
    res.status(201).json({ success: true, data: seo });
  } catch (err) {
    next(err);
  }
}

export async function getSeoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const seo = await seoService.getSeoForProject(userId, req.params.id);
    res.status(200).json({ success: true, data: seo });
  } catch (err) {
    next(err);
  }
}
