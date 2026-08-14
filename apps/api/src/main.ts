import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
loadDotenv({ path: resolve(process.cwd(), ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env") });

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { getConfig } from "@applyflow/config";
import { createLogger } from "@applyflow/observability";
import { AppModule } from "./app.module.js";

const logger = createLogger("api");

async function bootstrap() {
  const config = getConfig();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const fastify = app.getHttpAdapter().getInstance();
  await fastify.register(fastifyCookie as unknown as Parameters<typeof fastify.register>[0], {
    secret: config.SESSION_SECRET,
  });
  await fastify.register(fastifyCors as unknown as Parameters<typeof fastify.register>[0], {
    origin: [config.WEB_URL, config.ADMIN_URL],
    credentials: true,
  });

  app.setGlobalPrefix("v1", { exclude: ["health", "healthz"] });

  await app.listen(config.API_PORT, "0.0.0.0");
  logger.info("API listening", { port: config.API_PORT, env: config.APP_ENV });
}

bootstrap().catch((err) => {
  logger.error("Failed to start API", { error: String(err) });
  process.exit(1);
});
