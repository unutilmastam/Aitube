import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { prisma } from "@/infra/prisma/client";
import { AppError, NotFoundError, ForbiddenError } from "@/shared/errors/AppError";
import { encrypt, decrypt } from "@/shared/security/crypto";
import { createOAuthClient, getAuthUrl } from "./oauth-client";

const STATE_SECRET = process.env.JWT_ACCESS_SECRET as string;

// OAuth "state" parametriga userId'ni imzolab joylashtiramiz — CSRF himoyasi + userni aniqlash uchun
export function buildConnectUrl(userId: string): string {
  const state = jwt.sign({ userId }, STATE_SECRET, { expiresIn: "10m" });
  return getAuthUrl(state);
}

function verifyState(state: string): string {
  try {
    const payload = jwt.verify(state, STATE_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    throw new AppError("OAuth state yaroqsiz yoki muddati o'tgan", 400);
  }
}

export async function handleOAuthCallback(code: string, state: string) {
  const userId = verifyState(state);
  const client = createOAuthClient();

  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new AppError(
      "Google'dan to'liq token qaytmadi. Qayta urinib ko'ring (avval ulangan bo'lsa, avval uzib qayta ulang).",
      502
    );
  }

  client.setCredentials(tokens);
  const youtube = google.youtube({ version: "v3", auth: client });
  const channelsRes = await youtube.channels.list({ part: ["snippet"], mine: true });
  const channel = channelsRes.data.items?.[0];

  if (!channel?.id || !channel.snippet?.title) {
    throw new AppError("YouTube kanal topilmadi. Google akkauntingizda kanal borligini tekshiring.", 400);
  }

  const account = await prisma.youtubeAccount.upsert({
    where: { userId_channelId: { userId, channelId: channel.id } },
    create: {
      userId,
      channelId: channel.id,
      channelTitle: channel.snippet.title,
      accessTokenEncrypted: encrypt(tokens.access_token),
      refreshTokenEncrypted: encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(tokens.expiry_date),
    },
    update: {
      accessTokenEncrypted: encrypt(tokens.access_token),
      refreshTokenEncrypted: encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(tokens.expiry_date),
    },
  });

  return account;
}

export async function listConnectedChannels(userId: string) {
  const accounts = await prisma.youtubeAccount.findMany({ where: { userId } });
  // Tokenlarni hech qachon frontendga qaytarmaymiz
  return accounts.map((account: (typeof accounts)[number]) => {
    const { accessTokenEncrypted, refreshTokenEncrypted, ...rest } = account;
    return rest;
  });
}

export async function disconnectChannel(userId: string, youtubeAccountId: string) {
  const account = await prisma.youtubeAccount.findUnique({ where: { id: youtubeAccountId } });
  if (!account) throw new NotFoundError("Kanal topilmadi");
  if (account.userId !== userId) throw new ForbiddenError("Bu kanalga ruxsatingiz yo'q");

  await prisma.youtubeAccount.delete({ where: { id: youtubeAccountId } });
}

// Har bir haqiqiy so'rov oldidan tokenni tekshirib, kerak bo'lsa yangilaydi (refresh)
export async function getValidAuthClient(youtubeAccountId: string) {
  const account = await prisma.youtubeAccount.findUniqueOrThrow({
    where: { id: youtubeAccountId },
  });

  const client = createOAuthClient();
  client.setCredentials({
    access_token: decrypt(account.accessTokenEncrypted),
    refresh_token: decrypt(account.refreshTokenEncrypted),
    expiry_date: account.tokenExpiresAt.getTime(),
  });

  // Muddati o'tgan/o'tayotgan bo'lsa, googleapis avtomatik refresh qiladi — natijani qayta saqlaymiz
  if (account.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    if (credentials.access_token && credentials.expiry_date) {
      await prisma.youtubeAccount.update({
        where: { id: youtubeAccountId },
        data: {
          accessTokenEncrypted: encrypt(credentials.access_token),
          tokenExpiresAt: new Date(credentials.expiry_date),
        },
      });
      client.setCredentials(credentials);
    }
  }

  return client;
}
