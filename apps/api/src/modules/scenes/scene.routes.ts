import { Router } from "express";
import { requireAuth } from "@/shared/middleware/requireAuth";
import {
  generateAllVoicesHandler,
  generateScenesHandler,
  generateSceneVoiceHandler,
  listScenesHandler,
  updateSceneHandler,
} from "./scene.controller";
import {
  generateAllVisualsHandler,
  generateSceneVisualHandler,
  getRenderStatusHandler,
  startRenderHandler,
} from "@/modules/render/render.controller";

const router = Router();
router.use(requireAuth);

// /api/scripts/:scriptId/scenes
router.post("/:scriptId/scenes", generateScenesHandler);
router.get("/:scriptId/scenes", listScenesHandler);
router.patch("/scenes/:sceneId", updateSceneHandler);

// Ovoz generatsiyasi
router.post("/scenes/:sceneId/voice", generateSceneVoiceHandler);
router.post("/:scriptId/voice-all", generateAllVoicesHandler);

// Vizual generatsiyasi
router.post("/scenes/:sceneId/visual", generateSceneVisualHandler);
router.post("/:scriptId/visual-all", generateAllVisualsHandler);

// Video render (queue orqali)
router.post("/:scriptId/render", startRenderHandler);
router.get("/render-jobs/:renderJobId", getRenderStatusHandler);

export default router;
