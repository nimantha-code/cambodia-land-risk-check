import type { FastifyReply, FastifyRequest } from "fastify";
import type { AppConfig } from "./config.js";
import type { Database } from "./db.js";
import { findApiClientByHash } from "./repositories/apiClients.js";
import type { ApiClient } from "./types.js";
import { hashApiKey, timingSafeEqualText } from "./utils/crypto.js";

declare module "fastify" {
  interface FastifyRequest {
    apiClient?: ApiClient;
  }
}

const rateLimitBuckets = new Map<string, { windowStart: number; count: number }>();

export function createApiKeyAuthenticator(db: Database, config: AppConfig) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const apiKey = readHeader(request, "x-api-key");
    if (!apiKey) {
      await reply.code(401).send({ error: "missing_api_key", message: "x-api-key header is required" });
      return;
    }

    const keyHash = hashApiKey(apiKey, config.apiKeyPepper);
    const client = await findApiClientByHash(db, keyHash);
    if (!client) {
      await reply.code(401).send({ error: "invalid_api_key", message: "API key is invalid or disabled" });
      return;
    }

    request.apiClient = client;
    if (!isWithinRateLimit(client)) {
      await reply.code(429).send({ error: "rate_limit_exceeded", message: "API rate limit exceeded" });
      return;
    }
  };
}

export function createAdminAuthenticator(config: AppConfig) {
  return async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const adminKey = readHeader(request, "x-admin-api-key");
    if (!adminKey || !timingSafeEqualText(adminKey, config.adminApiKey)) {
      await reply.code(401).send({ error: "invalid_admin_key", message: "Admin API key is required" });
      return;
    }
  };
}

function readHeader(request: FastifyRequest, name: string): string | null {
  const value = request.headers[name];
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function isWithinRateLimit(client: ApiClient): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = rateLimitBuckets.get(client.id);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    rateLimitBuckets.set(client.id, { windowStart: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= client.rateLimitPerMinute;
}
