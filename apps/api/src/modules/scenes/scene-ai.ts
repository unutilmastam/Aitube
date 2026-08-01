import OpenAI from "openai";
import { z } from "zod";
import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// AI'dan qaytishi kutilayotgan JSON strukturasi
const sceneSchema = z.object({
  scenes: z.array(
    z.object({
      narration: z.string().min(1),
      visualPrompt: z.string().min(1),
      cameraMotion: z.enum(["static", "pan-left", "pan-right", "zoom-in", "zoom-out"]),
      transition: z.enum(["CUT", "FADE", "SLIDE", "ZOOM"]),
      durationSec: z.number().min(8).max(25),
    })
  ),
});

export type GeneratedScene = z.infer<typeof sceneSchema>["scenes"][number];

interface BreakdownParams {
  scriptContent: string;
  niche: string;
  language: string;
}

export async function breakdownScriptIntoScenes(
  params: BreakdownParams
): Promise<GeneratedScene[]> {
  const { scriptContent, language } = params;

  const systemPrompt = `Sen professional video-rejissyorsan. Berilgan ssenariyni video sahnalarga (scenes) bo'lasan. Har bir sahna 3-15 soniya davomida bo'lishi, va vizual jihatdan original (hech qanday tayyor kontentga o'xshamaydigan) bo'lishi kerak. Faqat JSON formatda javob ber, boshqa hech narsa yozma.`;

  const userPrompt = `Ssenariy matni (${language} tilida):
"""
${scriptContent}
"""

Bu matnni mantiqiy sahnalarga bo'l. Har bir sahna uchun:
- narration: shu sahnada aytiladigan matn qismi (ssenariydan olingan, o'zgartirmasdan)
- visualPrompt: shu sahna uchun AI orqali generatsiya qilinadigan original vizual tasvirning inglizcha tavsifi (rasm/video generatorga beriladigan prompt)
- cameraMotion: static | pan-left | pan-right | zoom-in | zoom-out
- transition: CUT | FADE | SLIDE | ZOOM
- durationSec: taxminiy davomiylik (soniya, 8 dan 25 gacha — sahnalarni imkon qadar UZUNROQ qiling, chunki har sahna uchun alohida rasm generatsiya qilinadi va bu xarajatga bevosita ta'sir qiladi. Faqat mantiqiy zarurat bo'lganda yangi sahna oching)

Faqat quyidagi JSON formatida javob ber:
{"scenes": [{"narration": "...", "visualPrompt": "...", "cameraMotion": "...", "transition": "...", "durationSec": 5}]}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new AppError("AI bo'sh javob qaytardi, qayta urinib ko'ring", 502);
    }

    const parsed = sceneSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      logger.error("Scene AI response validation failed", { issues: parsed.error.issues });
      throw new AppError("AI noto'g'ri formatda javob qaytardi, qayta urinib ko'ring", 502);
    }

    if (parsed.data.scenes.length === 0) {
      throw new AppError("Sahnalar yaratilmadi, ssenariyni tekshirib qayta urinib ko'ring", 502);
    }

    return parsed.data.scenes;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("Scene breakdown failed", { error: err });
    throw new AppError(
      "Sahnalarga bo'lishda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.",
      502
    );
  }
}
