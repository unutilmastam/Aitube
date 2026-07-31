import bcrypt from "bcryptjs";
import { prisma } from "@/infra/prisma/client";
import { ConflictError, UnauthorizedError } from "@/shared/errors/AppError";
import { LoginInput, RegisterInput } from "./auth.validators";
import {
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.util";

const SALT_ROUNDS = 12;

async function issueTokenPair(userId: string, role: "USER" | "ADMIN") {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email: input.email, passwordHash },
  });

  const tokens = await issueTokenPair(user.id, user.role);

  return {
    user: { id: user.id, email: user.email, role: user.role, credits: user.credits },
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("Email yoki parol noto'g'ri");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError("Email yoki parol noto'g'ri");
  }

  const tokens = await issueTokenPair(user.id, user.role);

  return {
    user: { id: user.id, email: user.email, role: user.role, credits: user.credits },
    ...tokens,
  };
}

export async function refresh(oldRefreshToken: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token yaroqsiz yoki muddati o'tgan");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token yaroqsiz yoki muddati o'tgan");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new UnauthorizedError("Foydalanuvchi topilmadi");
  }

  // Eski tokenni bekor qilib, yangi juftlik chiqaramiz (rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  return issueTokenPair(user.id, user.role);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
}
