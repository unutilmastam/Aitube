# Platform — Phase 1 + Phase 2 (TO'LIQ TUGADI ✅)

Tayyor: **Auth + Project + Script + Scene + Voice (TTS) + Visual (AI rasm) + Video Composer (FFmpeg) + Thumbnail Generator + SEO Generator**.

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

POST /api/projects/:id/thumbnails          # 3 ta thumbnail variant (AI)
GET  /api/projects/:id/thumbnails
PATCH /api/projects/thumbnails/:thumbnailId/select

POST /api/projects/:id/seo                 # sarlavha, tavsif, teglar, hashtag, chapters (AI)
GET  /api/projects/:id/seo

POST /api/scripts/scenes/:sceneId/voice    # bitta sahna uchun ovoz (TTS)
POST /api/scripts/:scriptId/voice-all      # barcha sahnalar uchun ovoz

POST /api/scripts/scenes/:sceneId/visual   # bitta sahna uchun AI rasm
POST /api/scripts/:scriptId/visual-all     # barcha sahnalar uchun AI rasm

POST /api/scripts/:scriptId/render         # video render — queue'ga qo'shadi (202 Accepted)
GET  /api/scripts/render-jobs/:renderJobId # render progress (0-100) va yakuniy video URL
```

## To'liq pipeline (boshidan oxirigacha)

```
1. POST /api/projects                       → loyiha yaratish
2. POST /api/projects/:id/script             → skript (AI)
3. POST /api/scripts/:scriptId/scenes        → sahnalarga bo'lish (AI)
4. POST /api/scripts/:scriptId/voice-all     → har sahna uchun ovoz (ElevenLabs)
5. POST /api/scripts/:scriptId/visual-all    → har sahna uchun AI rasm (DALL-E)
6. POST /api/scripts/:scriptId/render        → FFmpeg worker video yig'adi (background)
7. GET  /api/scripts/render-jobs/:id         → progress kuzatish, tugagach outputFileUrl
8. POST /api/projects/:id/thumbnails         → 3 ta thumbnail variant (parallel, video bilan bog'liq emas)
9. POST /api/projects/:id/seo                → sarlavha/tavsif/teglar/chapters
```

Phase 2 shu bilan **to'liq tugadi** — endi platforma "mavzu kiriting" dan "YouTube'ga yuklashga tayyor to'liq paket" (video + thumbnail + SEO) gacha ishlaydi.

**Muhim:** 6-qadam **worker** konteynerida ishlaydi (FFmpeg og'ir CPU jarayoni), shuning uchun
`docker compose up -d --build` paytida `worker` xizmati ham ko'tarilishi shart — aks holda
render job abadiy "QUEUED" holatida qoladi.

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
