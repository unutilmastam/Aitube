import OpenAI from "openai";
import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const NICHE_GUIDELINES: Record<string, string> = {
  EDUCATIONAL: "aniq faktlarga asoslangan, tushunarli va o'rgatuvchi",
  HISTORY: "tarixiy jihatdan aniq, hikoya uslubida, xronologik",
  TECHNOLOGY: "texnik jihatdan to'g'ri, zamonaviy misollar bilan",
  SCIENCE: "ilmiy asoslangan, murakkab tushunchalarni sodda tilda",
  BUSINESS: "amaliy maslahatlar bilan, real case'lar asosida",
  MOTIVATION: "ilhomlantiruvchi, energiyali, chaqiruvchi ohangda",
  ENTERTAINMENT: "qiziqarli, kutilmagan burilishlar bilan",
  FACTS: "qisqa va zich faktlar ketma-ketligi, har biri ajablantiruvchi",
  STORIES: "hikoya tuzilishi: kirish-rivojlanish-kulminatsiya-yechim",
};

interface GenerateScriptParams {
  topic: string;
  niche: string;
  language: string;
  targetDurationSeconds?: number;
}

export async function generateScript(params: GenerateScriptParams): Promise<string> {
  const { topic, niche, language, targetDurationSeconds = 180 } = params;
  const approxWords = Math.round((targetDurationSeconds / 60) * 140); // ~140 so'z/daqiqa gapirish tezligi

  const guideline = NICHE_GUIDELINES[niche] || "sifatli va original";

  const systemPrompt = `Sen professional YouTube ssenariy yozuvchisisan. Faqat 100% original kontent yaratasan — hech qachon boshqa muallif matnini ko'chirmaysan yoki qayta yozmaysan. Ssenariylaring ${guideline} bo'lishi kerak.`;

  const userPrompt = `Mavzu: "${topic}"
Til: ${language}
Taxminiy davomiylik: ${targetDurationSeconds} soniya (~${approxWords} so'z)

Talablar:
- Kirish (hook) — birinchi 5 soniyada tomoshabinni ushlab qolish kerak
- Asosiy qism — mantiqiy ketma-ketlikda
- Xulosa — chaqiruv (call-to-action) bilan
- Faqat original matn, iqtiboslarsiz
- Sahna belgilarisiz, faqat sof narratsiya matni`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: Math.round(approxWords * 2),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AppError("AI bo'sh javob qaytardi, qayta urinib ko'ring", 502);
    }

    return content.trim();
  } catch (err) {
    logger.error("Script generation failed", { error: err, topic });
    throw new AppError(
      "Ssenariy generatsiya qilishda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.",
      502
    );
  }
}
