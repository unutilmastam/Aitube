import { Router } from "express";
import { requireAuth } from "@/shared/middleware/requireAuth";
import {
  createProjectHandler,
  generateScriptHandler,
  getProjectHandler,
  listProjectsHandler,
  updateScriptHandler,
} from "./project.controller";
import {
  generateSeoHandler,
  generateThumbnailsHandler,
  getSeoHandler,
  listThumbnailsHandler,
  selectThumbnailHandler,
} from "./meta.controller";

const router = Router();

router.use(requireAuth); // shu modulning barcha route'lari login talab qiladi

router.post("/", createProjectHandler);
router.get("/", listProjectsHandler);
router.get("/:id", getProjectHandler);

router.post("/:id/script", generateScriptHandler);
router.patch("/:id/script/:scriptId", updateScriptHandler);

// Thumbnail
router.post("/:id/thumbnails", generateThumbnailsHandler);
router.get("/:id/thumbnails", listThumbnailsHandler);
router.patch("/thumbnails/:thumbnailId/select", selectThumbnailHandler);

// SEO
router.post("/:id/seo", generateSeoHandler);
router.get("/:id/seo", getSeoHandler);

export default router;
