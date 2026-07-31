import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError, AppError } from "@/shared/errors/AppError";
import * as accountService from "./youtube-account.service";
import * as uploadService from "./upload.service";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.userId;
}

export async function connectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const url = accountService.buildConnectUrl(userId);
    res.status(200).json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
}

// Google shu endpoint'ga qaytaradi (redirect) — auth talab qilinmaydi, state orqali user aniqlanadi
export async function oauthCallbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code || !state) {
      throw new AppError("Google'dan kod yoki state qaytmadi", 400);
    }
    const account = await accountService.handleOAuthCallback(code, state);
    res
      .status(200)
      .send(`<html><body style="font-family:sans-serif;text-align:center;margin-top:80px">
        <h2>✅ ${account.channelTitle} kanali ulandi</h2>
        <p>Bu oynani yopib, ilovaga qaytishingiz mumkin.</p>
      </body></html>`);
  } catch (err) {
    next(err);
  }
}

export async function listChannelsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const accounts = await accountService.listConnectedChannels(userId);
    res.status(200).json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
}

export async function disconnectChannelHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    await accountService.disconnectChannel(userId, req.params.youtubeAccountId);
    res.status(200).json({ success: true, message: "Kanal uzildi" });
  } catch (err) {
    next(err);
  }
}

const createUploadSchema = z.object({
  projectId: z.string().uuid(),
  youtubeAccountId: z.string().uuid(),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).default("PRIVATE"),
  scheduledAt: z.string().datetime().optional(),
});

export async function createUploadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const input = createUploadSchema.parse(req.body);
    const job = await uploadService.createUploadJob(userId, {
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    });
    res.status(202).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

export async function getUploadStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const job = await uploadService.getUploadJobStatus(userId, req.params.uploadJobId);
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

export async function cancelUploadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const job = await uploadService.cancelUploadJob(userId, req.params.uploadJobId);
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}
