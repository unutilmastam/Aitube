import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validatsiya xatosi",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(err.message, { stack: err.stack, path: req.path });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  const error = err as Error;
  logger.error(error.message, { stack: error.stack, path: req.path });

  return res.status(500).json({
    success: false,
    message: "Serverda kutilmagan xatolik yuz berdi",
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route topilmadi: ${req.originalUrl}` });
}
