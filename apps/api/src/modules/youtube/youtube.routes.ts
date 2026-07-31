import { Router } from "express";
import { requireAuth } from "@/shared/middleware/requireAuth";
import {
  cancelUploadHandler,
  connectHandler,
  createUploadHandler,
  disconnectChannelHandler,
  getUploadStatusHandler,
  listChannelsHandler,
  oauthCallbackHandler,
} from "./youtube.controller";

const router = Router();

// Callback — Google browser orqali qaytaradi, JWT header bo'lmaydi, shuning uchun requireAuth'dan oldin
router.get("/oauth/callback", oauthCallbackHandler);

router.use(requireAuth);

router.get("/connect", connectHandler);
router.get("/channels", listChannelsHandler);
router.delete("/channels/:youtubeAccountId", disconnectChannelHandler);

router.post("/upload", createUploadHandler);
router.get("/upload/:uploadJobId", getUploadStatusHandler);
router.post("/upload/:uploadJobId/cancel", cancelUploadHandler);

export default router;
