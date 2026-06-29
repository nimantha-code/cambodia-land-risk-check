import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { createAdminAuthenticator } from "../auth.js";
import { activateDataset, createDatasetFromGeoJson, getActiveDataset, getDatasetById, type GeoJsonFeatureCollection } from "../repositories/datasets.js";

type UploadDatasetBody = {
  version: string;
  source: string;
  metadata?: Record<string, unknown>;
  geojson: GeoJsonFeatureCollection;
};

export async function registerDatasetRoutes(app: FastifyInstance, db: Database, config: AppConfig): Promise<void> {
  const authenticateAdmin = createAdminAuthenticator(config);

  app.get("/v1/datasets/current", async (_request, reply) => {
    const dataset = await getActiveDataset(db);
    if (!dataset) {
      return reply.code(404).send({ error: "no_active_dataset", message: "No active GIS dataset is available" });
    }
    return dataset;
  });

  app.post<{ Body: UploadDatasetBody }>("/v1/datasets", { preHandler: authenticateAdmin }, async (request, reply) => {
    const body = request.body;
    if (!body?.version || !body.source || !body.geojson) {
      return reply.code(400).send({
        error: "invalid_dataset",
        message: "version, source, and geojson are required"
      });
    }

    const dataset = await createDatasetFromGeoJson(db, {
      version: body.version,
      source: body.source,
      metadata: body.metadata,
      featureCollection: body.geojson
    });

    return reply.code(201).send(dataset);
  });

  app.post<{ Params: { datasetId: string } }>("/v1/datasets/:datasetId/activate", { preHandler: authenticateAdmin }, async (request, reply) => {
    const dataset = await getDatasetById(db, request.params.datasetId);
    if (!dataset) {
      return reply.code(404).send({ error: "dataset_not_found", message: "Dataset not found" });
    }
    return activateDataset(db, request.params.datasetId);
  });
}
