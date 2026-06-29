import type { PoolClient } from "pg";
import type { Database } from "../db.js";
import type { ActiveDataset } from "../types.js";

type DatasetRow = {
  id: string;
  version: string;
  source: string;
  feature_count: number;
  metadata: Record<string, unknown> | null;
  uploaded_at: Date | string;
  activated_at: Date | string | null;
};

export type GeoJsonFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  crs?: {
    type?: string;
    properties?: Record<string, unknown>;
  };
  features: GeoJsonFeature[];
};

export async function getActiveDataset(db: Database): Promise<ActiveDataset | null> {
  const result = await db.query(
    `SELECT id, version, source, feature_count, metadata, uploaded_at, activated_at
     FROM gis_datasets
     WHERE status = 'active'
     ORDER BY activated_at DESC NULLS LAST
     LIMIT 1`
  );
  return mapDataset(result.rows[0]);
}

export async function getDatasetById(db: Database, datasetId: string): Promise<ActiveDataset | null> {
  const result = await db.query(
    `SELECT id, version, source, feature_count, metadata, uploaded_at, activated_at
     FROM gis_datasets
     WHERE id = $1`,
    [datasetId]
  );
  return mapDataset(result.rows[0]);
}

export async function createDatasetFromGeoJson(db: Database, input: {
  version: string;
  source: string;
  metadata?: Record<string, unknown>;
  featureCollection: GeoJsonFeatureCollection;
}): Promise<ActiveDataset> {
  validateFeatureCollection(input.featureCollection);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const dataset = await client.query(
      `INSERT INTO gis_datasets (version, source, status, feature_count, metadata)
       VALUES ($1, $2, 'uploaded', $3, $4)
       RETURNING id, version, source, feature_count, metadata, uploaded_at, activated_at`,
      [input.version, input.source, input.featureCollection.features.length, input.metadata || {}]
    );

    for (const [index, feature] of input.featureCollection.features.entries()) {
      await insertProtectedArea(client, dataset.rows[0].id, feature, index);
    }

    await client.query("COMMIT");
    return mapDataset(dataset.rows[0]) as ActiveDataset;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function activateDataset(db: Database, datasetId: string): Promise<ActiveDataset> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const exists = await client.query("SELECT id FROM gis_datasets WHERE id = $1", [datasetId]);
    if (!exists.rowCount) throw new Error("Dataset not found");

    await client.query(
      `UPDATE gis_datasets
       SET status = CASE WHEN id = $1 THEN 'active' ELSE 'archived' END,
           activated_at = CASE WHEN id = $1 THEN now() ELSE activated_at END`,
      [datasetId]
    );

    const active = await client.query(
      `SELECT id, version, source, feature_count, metadata, uploaded_at, activated_at
       FROM gis_datasets
       WHERE id = $1`,
      [datasetId]
    );
    await client.query("COMMIT");
    return mapDataset(active.rows[0]) as ActiveDataset;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function validateFeatureCollection(value: GeoJsonFeatureCollection): void {
  if (!value || value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    throw new Error("GeoJSON must be a FeatureCollection");
  }
  validateCrs(value);
  if (value.features.length === 0) throw new Error("GeoJSON must contain at least one feature");
  for (const feature of value.features) {
    if (feature.type !== "Feature") throw new Error("GeoJSON contains a non-Feature item");
    if (!feature.geometry || !["Polygon", "MultiPolygon"].includes(feature.geometry.type)) {
      throw new Error("All features must have Polygon or MultiPolygon geometry");
    }
    validateGeometryBounds(feature);
    if (!feature.properties?.name && !feature.properties?.Name && !feature.properties?.NAME) {
      throw new Error("Every feature must include a name property");
    }
  }
}

function validateCrs(value: GeoJsonFeatureCollection): void {
  if (!value.crs) return;
  const crsName = String(value.crs.properties?.name || "").toLowerCase();
  const isWgs84 = crsName.includes("epsg:4326") || crsName.includes("crs84") || crsName.includes("wgs84") || crsName.includes("wgs 84");
  if (!isWgs84) {
    throw new Error("GeoJSON CRS must be WGS84 / EPSG:4326");
  }
}

function validateGeometryBounds(feature: GeoJsonFeature): void {
  const points = collectPositions(feature.geometry.coordinates);
  if (points.length < 4) throw new Error("Polygon geometry must contain at least four positions");

  for (const [lng, lat] of points) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error("GeoJSON coordinates must be numeric");
    if (lng < 101.0 || lng > 108.8 || lat < 9.0 || lat > 15.5) {
      throw new Error("GeoJSON contains coordinates outside the Cambodia review bounds");
    }
  }
}

function collectPositions(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) return [];
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return [[value[0], value[1]]];
  }
  return value.flatMap((item) => collectPositions(item));
}

async function insertProtectedArea(client: PoolClient, datasetId: string, feature: GeoJsonFeature, index: number): Promise<void> {
  const props = feature.properties || {};
  const name = stringProp(props, "name") || stringProp(props, "Name") || stringProp(props, "NAME") || `Protected area ${index + 1}`;
  const category = stringProp(props, "category") || stringProp(props, "type") || "Protected area";
  const province = stringProp(props, "province") || stringProp(props, "Province");
  const externalId = stringProp(props, "id") || stringProp(props, "external_id");

  await client.query(
    `INSERT INTO protected_areas (dataset_id, external_id, name, category, province, metadata, geom)
     VALUES (
       $1, $2, $3, $4, $5, $6,
       ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326))
     )`,
    [datasetId, externalId, name, category, province, props, JSON.stringify(feature.geometry)]
  );
}

function stringProp(props: Record<string, unknown>, key: string): string | null {
  const value = props[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapDataset(row: DatasetRow | undefined): ActiveDataset | null {
  if (!row) return null;
  return {
    id: row.id,
    version: row.version,
    source: row.source,
    featureCount: row.feature_count,
    metadata: row.metadata || {},
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at,
    activatedAt: row.activated_at instanceof Date ? row.activated_at.toISOString() : row.activated_at
  };
}
