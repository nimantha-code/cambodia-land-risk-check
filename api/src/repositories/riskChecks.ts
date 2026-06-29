import type { Database } from "../db.js";
import type { ApiClient, DecisionStatus, NearestArea, ResolvedLocation, Thresholds } from "../types.js";

export async function insertRiskCheck(db: Database, input: {
  client: ApiClient | null;
  datasetId: string | null;
  requestInput: Record<string, unknown>;
  location: ResolvedLocation | null;
  status: DecisionStatus;
  decision: string;
  nearestArea: NearestArea | null;
  distanceKm: number | null;
  thresholds: Thresholds;
  warnings: string[];
}): Promise<{ id: string; createdAt: string }> {
  const result = await db.query(
    `INSERT INTO risk_checks (
       client_id, dataset_id, input, resolved_location, status, decision,
       nearest_area, distance_km, thresholds, warnings
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, created_at`,
    [
      input.client?.id || null,
      input.datasetId,
      input.requestInput,
      input.location,
      input.status,
      input.decision,
      input.nearestArea,
      input.distanceKm,
      input.thresholds,
      input.warnings
    ]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}
