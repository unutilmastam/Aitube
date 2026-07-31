import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "@/modules/auth/auth.routes";
import projectRoutes from "@/modules/projects/project.routes";
import sceneRoutes from "@/modules/scenes/scene.routes";
import youtubeRoutes from "@/modules/youtube/youtube.routes";
import { errorHandler, notFoundHandler } from "@/shared/middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Umumiy rate limit — barcha route'lar uchun
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/scripts", sceneRoutes);
  app.use("/api/youtube", youtubeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
