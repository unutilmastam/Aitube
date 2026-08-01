import OpenAI from "openai";
import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";
import { uploadBuffer } from "@/infra/minio/client";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ThumbnailHeadlineResult {
  headline: string;
  visualDescription: string;
}

// 1-qadam: skript asosida qisqa, CTR-yuqori sarlavha va vizual g'oya yaratamiz
export async function generateThumbnailConcept(
  scriptContent: string,
  title: string
): Promise<ThumbnailHeadlineResult> {
  const prompt = `Video sarlavhasi: "${title}"
Skript qisqacha mazmuni: "${scriptContent.slice(0, 500)}..."

Shu video uchun YouTube thumbnail'ga chiqadigan JUDA QISQA (2-5 so'z), diqqatni tortuvchi, qiziqish uyg'otuvchi matn (headline) yoz. Shuningdek thumbnail fonida qanday original vizual sahna bo'lishi kerakligini inglizcha 1 jumlada tasvirla (odam, ob'ekt, emotsiya — original, brendsiz).

Faqat JSON: {"headline": "...", "visualDescription": "..."}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new AppError("AI bo'sh javob qaytardi", 502);

    const parsed = JSON.parse(raw) as ThumbnailHeadlineResult;
    return parsed;
  } catch (err) {
    logger.error("Thumbnail concept generation failed", { error: err });
    throw new AppError("Thumbnail konsepsiyasini yaratishda xatolik", 502);
  }
}

// 2-qadam: shu konsepsiya asosida yuqori-kontrast, CTR-optimallashgan rasm generatsiya qilamiz
export async function generateThumbnailImage(
  visualDescription: string,
  headline: string,
  projectId: string,
  variant: number
): Promise<string> {
  const prompt = `YouTube thumbnail, high contrast, vibrant colors, dramatic lighting, professional photography style: ${visualDescription}. Bold composition optimized for small preview size. No text, no logos, no watermarks, completely original — headline "${headline}" will be overlaid separately.`;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1-mini",
      prompt,
      size: "1536x1024",
      quality: "high",
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new AppError("Thumbnail rasm generatsiya qilinmadi", 502);

    const buffer = Buffer.from(b64, "base64");
    const objectKey = `thumbnails/${projectId}-v${variant}-${Date.now()}.png`;
    return uploadBuffer(objectKey, buffer, "image/png");
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("Thumbnail image generation failed", { error: err });
    throw new AppError("Thumbnail rasm generatsiya qilishda xatolik", 502);
  }
}
