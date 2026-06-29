import type { Database } from "../db.js";
import type { NearestArea, Point } from "../types.js";

export async function findNearestProtectedAreas(db: Database, input: {
  datasetId: string;
  point: Point;
  limit?: number;
}): Promise<NearestArea[]> {
  const result = await db.query(
    `WITH applicant AS (
       SELECT ST_SetSRID(ST_MakePoint($2, $3), 4326) AS geom
     )
     SELECT
       pa.id,
       pa.external_id,
       pa.name,
       pa.category,
       pa.province,
       ST_Covers(pa.geom, applicant.geom) AS inside,
       ST_Distance(pa.geom::geography, applicant.geom::geography) / 1000.0 AS distance_km
     FROM protected_areas pa, applicant
     WHERE pa.dataset_id = $1
     ORDER BY pa.geom <-> applicant.geom
     LIMIT $4`,
    [input.datasetId, input.point.lng, input.point.lat, input.limit || 4]
  );

  return result.rows.map((row) => ({
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    category: row.category,
    province: row.province,
    inside: row.inside,
    distanceKm: Number(row.distance_km)
  }));
}
