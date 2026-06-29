import crypto from "node:crypto";
import { loadConfig } from "../src/config.js";
import { closeDb, createDb } from "../src/db.js";
import { createApiClient } from "../src/repositories/apiClients.js";
import { hashApiKey } from "../src/utils/crypto.js";

const name = process.argv[2] || "demo-client";
const rawApiKey = process.argv[3] || `lr_${crypto.randomBytes(24).toString("hex")}`;
const config = loadConfig();
const db = createDb(config);

try {
  const client = await createApiClient(db, {
    name,
    keyHash: hashApiKey(rawApiKey, config.apiKeyPepper)
  });
  console.log(JSON.stringify({
    id: client.id,
    name: client.name,
    apiKey: rawApiKey,
    note: "Store this API key securely. It cannot be recovered from the database."
  }, null, 2));
} finally {
  await closeDb(db);
}
