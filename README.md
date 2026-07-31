# Platform — Phase 1 + Phase 2 (Core MVP + Video Engine boshlanishi)

Tayyor: **Auth (JWT) + Project + Script Generator + Scene Generator + Voice Generator (TTS)**.

## Ishga tushirish (lokal)

```bash
cp .env.example .env
# .env faylida OPENAI_API_KEY va JWT sirlarini to'ldiring

cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API `http://localhost:4000` da ishga tushadi.

## Docker orqali (tavsiya etiladi — VPS uchun ham shu)

```bash
cp .env.example .env
docker compose up -d --build
```

Bu Postgres, Redis, MinIO, API va Nginx'ni bir vaqtda ko'taradi.

## API endpointlar (Phase 1)

```
POST /api/auth/register        { email, password }
POST /api/auth/login           { email, password }
POST /api/auth/refresh         { refreshToken }
POST /api/auth/logout          { refreshToken }

POST /api/projects             { title, niche, language }   [Auth talab qiladi]
GET  /api/projects
GET  /api/projects/:id
POST /api/projects/:id/script  { topic, targetDurationSeconds? }
PATCH /api/projects/:id/script/:scriptId  { content }

POST /api/scripts/:scriptId/scenes         # skriptni sahnalarga bo'ladi (AI)
GET  /api/scripts/:scriptId/scenes         # sahnalar ro'yxati
PATCH /api/scripts/scenes/:sceneId         # sahnani tahrirlash

POST /api/scripts/scenes/:sceneId/voice    # bitta sahna uchun ovoz (TTS)
POST /api/scripts/:scriptId/voice-all      # barcha sahnalar uchun ovoz
```

Har bir so'rov `Authorization: Bearer <accessToken>` header talab qiladi (register/login'dan tashqari).

## Muhim eslatmalar

- `OPENAI_API_KEY` bo'lmasa, `/script` endpoint xatolik qaytaradi — bu kutilgan holat.
- Har bir skript generatsiyasi foydalanuvchidan **1 credit** yechadi (`User.credits`, default 10). Bu keyinchalik billing tizimining fundamenti.
- `apps/web` hozircha placeholder — to'liq React dashboard **Phase 2**da qo'shiladi.

## Keyingi qadam — Phase 2

- Scene Generator (skriptni sahnalarga bo'lish)
- Voice Generator (TTS)
- Visual Generator (AI rasm/video)
- Video Composer (FFmpeg + Redis queue worker)
- Thumbnail va SEO Generator
- React dashboard (loyihalar ro'yxati, skript tahrirlash UI)
