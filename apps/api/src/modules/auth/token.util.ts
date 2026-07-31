import jwt, { SignOptions } from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET va JWT_REFRESH_SECRET .env faylida albatta belgilanishi kerak"
  );
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES as SignOptions["expiresIn"] };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(payload: { userId: string }): string {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES as SignOptions["expiresIn"] };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
}

// Refresh token muddatini millisekundga aylantirish (DB'ga saqlash uchun)
export function refreshExpiryDate(): Date {
  const days = parseInt(REFRESH_EXPIRES.replace("d", ""), 10) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
