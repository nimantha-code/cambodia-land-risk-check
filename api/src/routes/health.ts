import type { FastifyInstance } from "fastify";
import type { Database } from "../db.js";
import { getActiveDataset } from "../repositories/datasets.js";

export async function registerHealthRoutes(app: FastifyInstance, db: Database): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/ready", async (_request, reply) => {
    try {
      await db.query("SELECT 1");
      const dataset = await getActiveDataset(db);
      if (!dataset) {
        return reply.code(503).send({ status: "not_ready", database: "ok", activeDataset: null });
      }
      return { status: "ready", database: "ok", activeDataset: dataset };
    } catch (error) {
      return reply.code(503).send({
        status: "not_ready",
        database: "error",
        message: error instanceof Error ? error.message : "Unknown readiness error"
      });
    }
  });
}
