import { Router } from "express";
import { requireAuth } from "@/shared/middleware/requireAuth";
import {
  generateAllVoicesHandler,
  generateScenesHandler,
  generateSceneVoiceHandler,
  listScenesHandler,
  updateSceneHandler,
} from "./scene.controller";

const router = Router();
router.use(requireAuth);

// /api/scripts/:scriptId/scenes
router.post("/:scriptId/scenes", generateScenesHandler);
router.get("/:scriptId/scenes", listScenesHandler);
router.patch("/scenes/:sceneId", updateSceneHandler);

// Ovoz generatsiyasi
router.post("/scenes/:sceneId/voice", generateSceneVoiceHandler);
router.post("/:scriptId/voice-all", generateAllVoicesHandler);

export default router;
