import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@/shared/errors/AppError";
import { verifyAccessToken, AccessTokenPayload } from "@/modules/auth/token.util";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Token taqdim etilmagan"));
  }

  const token = header.split(" ")[1];

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Token yaroqsiz yoki muddati o'tgan"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return next(new UnauthorizedError("Faqat administrator uchun ruxsat berilgan"));
  }
  next();
}
