import cors from "@fastify/cors";
import fastify from "fastify";
import type { AppConfig } from "./config.js";
import type { Database } from "./db.js";
import { registerDatasetRoutes } from "./routes/datasets.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerRiskCheckRoutes } from "./routes/riskChecks.js";

type ApiError = Error & {
  statusCode?: number;
  code?: string;
};

export async function buildApp(db: Database, config: AppConfig) {
  const app = fastify({
    logger: config.nodeEnv !== "test"
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed"), false);
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    const apiError = error as ApiError;
    const statusCode = typeof apiError.statusCode === "number" ? apiError.statusCode : 500;
    const code = apiError.code || "internal_error";
    reply.code(statusCode).send({
      error: code,
      message: error.message || "Unexpected API error"
    });
  });

  await registerHealthRoutes(app, db);
  await registerDatasetRoutes(app, db, config);
  await registerRiskCheckRoutes(app, db, config);

  return app;
}
