import fs from "node:fs/promises";
import { loadConfig } from "../src/config.js";
import { closeDb, createDb } from "../src/db.js";
import { activateDataset, createDatasetFromGeoJson, type GeoJsonFeatureCollection } from "../src/repositories/datasets.js";

const [geojsonPath, version, source, activateFlag] = process.argv.slice(2);
if (!geojsonPath || !version || !source) {
  console.error("Usage: npm run import:geojson -- <file.geojson> <version> <source> [--activate]");
  process.exit(1);
}

const config = loadConfig();
const db = createDb(config);

try {
  const raw = await fs.readFile(geojsonPath, "utf8");
  const geojson = JSON.parse(raw) as GeoJsonFeatureCollection;
  const dataset = await createDatasetFromGeoJson(db, {
    version,
    source,
    metadata: { importedBy: "import-geojson script", file: geojsonPath },
    featureCollection: geojson
  });

  const finalDataset = activateFlag === "--activate" ? await activateDataset(db, dataset.id) : dataset;
  console.log(JSON.stringify(finalDataset, null, 2));
} finally {
  await closeDb(db);
}
