import OpenAI from "openai";
import { z } from "zod";
import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const seoSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(50),
  tags: z.array(z.string()).min(5).max(30),
  hashtags: z.array(z.string()).min(3).max(10),
  chapters: z.array(z.object({ time: z.string(), label: z.string() })).optional(),
});

export type SeoResult = z.infer<typeof seoSchema>;

interface GenerateSeoParams {
  scriptContent: string;
  projectTitle: string;
  niche: string;
  language: string;
  scenes: { order: number; narration: string; durationSec: number }[];
}

export async function generateSeoMeta(params: GenerateSeoParams): Promise<SeoResult> {
  const { scriptContent, projectTitle, niche, language, scenes } = params;

  // Sahna davomiyliklaridan taxminiy chapter vaqtlarini hisoblab, AI'ga ma'lumot sifatida beramiz
  let cumulative = 0;
  const sceneTimings = scenes.map((s) => {
    const time = formatSeconds(cumulative);
    cumulative += s.durationSec;
    return `${time} - ${s.narration.slice(0, 60)}`;
  });

  const systemPrompt = `Sen YouTube SEO mutaxassisisan. Faqat original, YouTube siyosatiga mos, aldamchi bo'lmagan (clickbait emas, lekin qiziqarli) sarlavha va tavsiflar yozasan. Faqat JSON formatda javob ber.`;

  const userPrompt = `Video sarlavhasi (ishchi variant): "${projectTitle}"
Yo'nalish: ${niche}
Til: ${language}
Skript qisqacha: "${scriptContent.slice(0, 800)}"

Sahna vaqt jadvali (chapters uchun asos):
${sceneTimings.join("\n")}

Quyidagilarni yarat:
- title: YouTube uchun jozibali, 100 belgidan oshmagan sarlavha
- description: kamida 3 paragraf, birinchi 2 qatorda hook, keyin qisqacha mazmun, oxirida chaqiruv
- tags: 10-20 ta relevant kalit so'z
- hashtags: 3-5 ta hashtag (# belgisisiz, faqat so'z)
- chapters: sahna vaqtlariga mos, qisqa label bilan (masalan "0:00" "Kirish")

Faqat JSON: {"title":"...","description":"...","tags":["..."],"hashtags":["..."],"chapters":[{"time":"0:00","label":"..."}]}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new AppError("AI bo'sh javob qaytardi", 502);

    const parsed = seoSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      logger.error("SEO AI response validation failed", { issues: parsed.error.issues });
      throw new AppError("AI noto'g'ri formatda javob qaytardi, qayta urinib ko'ring", 502);
    }

    return parsed.data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("SEO generation failed", { error: err });
    throw new AppError("SEO generatsiya qilishda xatolik yuz berdi", 502);
  }
}

function formatSeconds(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
