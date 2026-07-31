import "dotenv/config";
import { createApp } from "./app";
import { logger } from "@/shared/logger";
import { prisma } from "@/infra/prisma/client";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

async function main() {
  await prisma.$connect();
  logger.info("PostgreSQL bilan ulanish o'rnatildi");

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`API server ${PORT}-portda ishga tushdi`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} qabul qilindi, server yopilmoqda...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Barcha ulanishlar yopildi. Xayr!");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error("Serverni ishga tushirishda fatal xatolik", { error: err });
  process.exit(1);
});
