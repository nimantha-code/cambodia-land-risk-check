import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { decideRisk, isWithinCambodiaScreeningBounds, normalizeThresholds, outOfScopeDecision } from "../domain.js";
import { getActiveDataset } from "../repositories/datasets.js";
import { insertRiskCheck } from "../repositories/riskChecks.js";
import { findNearestProtectedAreas } from "../repositories/spatialRisk.js";
import type { ApiClient, RiskCheckResult, Thresholds } from "../types.js";
import { resolveLocation } from "./geocoder.js";

export type RiskCheckRequest = {
  address?: string;
  lat?: number;
  lng?: number;
  restrictedDistanceKm?: number;
  cautionDistanceKm?: number;
  referenceId?: string;
};

export async function runRiskCheck(db: Database, config: AppConfig, client: ApiClient, body: RiskCheckRequest): Promise<RiskCheckResult> {
  const thresholds = normalizeThresholds(body, defaultThresholds(config));
  const dataset = await getActiveDataset(db);
  if (!dataset) {
    throw Object.assign(new Error("No active GIS dataset is available"), { statusCode: 503, code: "inactive_dataset" });
  }

  const { location, warnings } = await resolveLocation(config, body);
  if (!location) {
    const audit = await insertRiskCheck(db, {
      client,
      datasetId: dataset.id,
      requestInput: sanitizeInput(body),
      location: null,
      status: "error",
      decision: "Location could not be resolved",
      nearestArea: null,
      distanceKm: null,
      thresholds,
      warnings
    });
    return {
      checkId: audit.id,
      status: "error",
      decision: "Location could not be resolved",
      location: null,
      nearestAreas: [],
      distanceKm: null,
      dataset,
      thresholds,
      warnings,
      checkedAt: audit.createdAt
    };
  }

  if (!isWithinCambodiaScreeningBounds(location)) {
    const decision = outOfScopeDecision();
    const audit = await insertRiskCheck(db, {
      client,
      datasetId: dataset.id,
      requestInput: sanitizeInput(body),
      location,
      status: decision.status,
      decision: decision.decision,
      nearestArea: null,
      distanceKm: null,
      thresholds,
      warnings: [...warnings, "Location is outside Cambodia screening bounds"]
    });
    return {
      checkId: audit.id,
      ...decision,
      location,
      nearestAreas: [],
      distanceKm: null,
      dataset,
      thresholds,
      warnings: [...warnings, "Location is outside Cambodia screening bounds"],
      checkedAt: audit.createdAt
    };
  }

  const nearestAreas = await findNearestProtectedAreas(db, { datasetId: dataset.id, point: location, limit: 4 });
  if (!nearestAreas.length) {
    throw Object.assign(new Error("Active dataset has no protected areas"), { statusCode: 503, code: "empty_dataset" });
  }

  const nearest = nearestAreas[0];
  const decision = decideRisk(nearest.distanceKm, nearest.inside, thresholds);
  const audit = await insertRiskCheck(db, {
    client,
    datasetId: dataset.id,
    requestInput: sanitizeInput(body),
    location,
    status: decision.status,
    decision: decision.decision,
    nearestArea: nearest,
    distanceKm: nearest.distanceKm,
    thresholds,
    warnings
  });

  return {
    checkId: audit.id,
    ...decision,
    location,
    nearestAreas,
    distanceKm: nearest.distanceKm,
    dataset,
    thresholds,
    warnings,
    checkedAt: audit.createdAt
  };
}

function defaultThresholds(config: AppConfig): Thresholds {
  return {
    restrictedDistanceKm: config.defaultRestrictedDistanceKm,
    cautionDistanceKm: config.defaultCautionDistanceKm
  };
}

function sanitizeInput(body: RiskCheckRequest): Record<string, unknown> {
  return {
    address: body.address,
    lat: body.lat,
    lng: body.lng,
    restrictedDistanceKm: body.restrictedDistanceKm,
    cautionDistanceKm: body.cautionDistanceKm,
    referenceId: body.referenceId
  };
}
