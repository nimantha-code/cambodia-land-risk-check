import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { createApiKeyAuthenticator } from "../auth.js";
import { runRiskCheck, type RiskCheckRequest } from "../services/riskCheckService.js";

export async function registerRiskCheckRoutes(app: FastifyInstance, db: Database, config: AppConfig): Promise<void> {
  const authenticate = createApiKeyAuthenticator(db, config);

  app.post<{ Body: RiskCheckRequest }>("/v1/risk-checks", { preHandler: authenticate }, async (request, reply) => {
    const body = request.body || {};
    if (!hasAddress(body) && !hasCoordinates(body)) {
      return reply.code(400).send({
        error: "invalid_input",
        message: "Provide either address or lat/lng"
      });
    }
    if (hasCoordinates(body) && (!Number.isFinite(body.lat) || !Number.isFinite(body.lng))) {
      return reply.code(400).send({
        error: "invalid_coordinates",
        message: "lat and lng must be numbers"
      });
    }

    const result = await runRiskCheck(db, config, request.apiClient!, body);
    return reply.code(result.status === "error" ? 422 : 200).send(result);
  });
}

function hasAddress(body: RiskCheckRequest): boolean {
  return typeof body.address === "string" && body.address.trim().length > 0;
}

function hasCoordinates(body: RiskCheckRequest): boolean {
  return body.lat !== undefined || body.lng !== undefined;
}
