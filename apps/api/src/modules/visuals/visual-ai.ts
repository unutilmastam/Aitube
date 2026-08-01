import OpenAI from "openai";
import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";
import { uploadBuffer } from "@/infra/minio/client";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateVisualParams {
  visualPrompt: string;
  sceneId: string;
  aspectRatio?: "portrait" | "landscape"; // Shorts uchun portrait, Long video uchun landscape
}

// Diqqat: DALL-E 3 2026-yil may oyida OpenAI API'dan olib tashlangan.
// Hozir "gpt-image-1-mini" ishlatiladi — narxi ancha arzon va hali qo'llab-quvvatlanadi.
const SIZE_MAP: Record<string, "1024x1536" | "1536x1024"> = {
  portrait: "1024x1536",
  landscape: "1536x1024",
};

export async function generateVisual(params: GenerateVisualParams): Promise<string> {
  const { visualPrompt, sceneId, aspectRatio = "portrait" } = params;

  // Muallif huquqi va original kontent talabini kuchaytiruvchi qo'shimcha ko'rsatma
  const safePrompt = `${visualPrompt}. Original, telif huquqidan xoli, hech qanday mavjud brend, logotip yoki taniqli shaxsga o'xshamaydigan, professional sifatli tasvir.`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1-mini",
      prompt: safePrompt,
      size: SIZE_MAP[aspectRatio],
      quality: "low", // Xarajatni kamaytirish uchun — video fon rasmi uchun "low" yetarli
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new AppError("AI vizual generatsiya qila olmadi, qayta urinib ko'ring", 502);
    }

    const buffer = Buffer.from(b64, "base64");
    const objectKey = `visual/${sceneId}-${Date.now()}.png`;
    return uploadBuffer(objectKey, buffer, "image/png");
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("Visual generation failed", { error: err, sceneId });
    throw new AppError("Vizual generatsiya qilishda xatolik yuz berdi", 502);
  }
}
