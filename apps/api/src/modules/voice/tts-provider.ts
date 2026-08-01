import { AppError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logger";
import { uploadBuffer } from "@/infra/minio/client";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Til bo'yicha ovoz tanlash (ElevenLabs voice ID'lari — o'zbek/tojik/rus uchun
// multilingual model ishlatiladi, voice ID hisobingizdan olinadi)
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

interface SynthesizeParams {
  text: string;
  sceneId: string;
}

interface SynthesizeResult {
  fileUrl: string;
  durationSec: number;
}

export async function synthesizeVoice(params: SynthesizeParams): Promise<SynthesizeResult> {
  const { text, sceneId } = params;

  if (!ELEVENLABS_API_KEY) {
    throw new AppError(
      "ELEVENLABS_API_KEY sozlanmagan. .env faylida to'ldiring.",
      500
    );
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${DEFAULT_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        // Flash v2.5 — Multilingual v2'ga qaraganda taxminan 2x arzon, sifat biroz pastroq
        // lekin faceless YouTube kontent uchun yetarli
        model_id: "eleven_flash_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error("ElevenLabs TTS failed", { status: response.status, body: errBody });
      throw new AppError("Ovoz generatsiya qilishda xatolik yuz berdi", 502);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const objectKey = `voice/${sceneId}-${Date.now()}.mp3`;
    const fileUrl = await uploadBuffer(objectKey, audioBuffer, "audio/mpeg");

    // Taxminiy davomiylik: MP3 bitrate asosida hisoblash (aniqrog'i ffprobe bilan worker'da qilinadi)
    const approxDurationSec = Math.max(1, Math.round(text.split(/\s+/).length / 2.3));

    return { fileUrl, durationSec: approxDurationSec };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("Voice synthesis failed", { error: err });
    throw new AppError("Ovoz generatsiya qilishda xatolik yuz berdi", 502);
  }
}
