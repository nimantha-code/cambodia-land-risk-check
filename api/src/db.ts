import { Pool } from "pg";
import type { AppConfig } from "./config.js";

export type Database = Pool;

export function createDb(config: AppConfig): Database {
  return new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000
  });
}

export async function closeDb(db: Database): Promise<void> {
  await db.end();
}
