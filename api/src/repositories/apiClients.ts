import type { Database } from "../db.js";
import type { ApiClient } from "../types.js";

export async function findApiClientByHash(db: Database, keyHash: string): Promise<ApiClient | null> {
  const result = await db.query(
    `SELECT id, name, rate_limit_per_minute
     FROM api_clients
     WHERE key_hash = $1 AND status = 'active'`,
    [keyHash]
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    rateLimitPerMinute: row.rate_limit_per_minute
  };
}

export async function createApiClient(db: Database, input: {
  name: string;
  keyHash: string;
  allowedOrigins?: string[];
  rateLimitPerMinute?: number;
}): Promise<ApiClient> {
  const result = await db.query(
    `INSERT INTO api_clients (name, key_hash, allowed_origins, rate_limit_per_minute)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, rate_limit_per_minute`,
    [input.name, input.keyHash, input.allowedOrigins || [], input.rateLimitPerMinute || 120]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    rateLimitPerMinute: row.rate_limit_per_minute
  };
}
