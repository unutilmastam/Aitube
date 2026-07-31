import { Router } from "express";
import { requireAuth } from "@/shared/middleware/requireAuth";
import {
  createProjectHandler,
  generateScriptHandler,
  getProjectHandler,
  listProjectsHandler,
  updateScriptHandler,
} from "./project.controller";

const router = Router();

router.use(requireAuth); // shu modulning barcha route'lari login talab qiladi

router.post("/", createProjectHandler);
router.get("/", listProjectsHandler);
router.get("/:id", getProjectHandler);

router.post("/:id/script", generateScriptHandler);
router.patch("/:id/script/:scriptId", updateScriptHandler);

export default router;
