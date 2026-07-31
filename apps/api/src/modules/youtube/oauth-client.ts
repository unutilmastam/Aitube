import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  // Ishga tushishda darhol bildirish — YouTube integratsiyasi sozlanmagan bo'lsa,
  // shu modulni ishlatmaguncha xato chiqmaydi, lekin log orqali ogohlantiramiz
  // eslint-disable-next-line no-console
  console.warn(
    "[youtube] GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI to'liq sozlanmagan — YouTube integratsiyasi ishlamaydi"
  );
}

export function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export function getAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // refresh_token olish uchun shart
    prompt: "consent", // har doim refresh_token qaytarilishi uchun
    scope: YOUTUBE_SCOPES,
    state,
  });
}
