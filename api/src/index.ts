import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { closeDb, createDb } from "./db.js";

const config = loadConfig();
const db = createDb(config);
const app = await buildApp(db, config);

const shutdown = async () => {
  await app.close();
  await closeDb(db);
};

process.on("SIGINT", () => void shutdown().then(() => process.exit(0)));
process.on("SIGTERM", () => void shutdown().then(() => process.exit(0)));

await app.listen({ host: config.host, port: config.port });
