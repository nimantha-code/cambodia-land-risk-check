import type { Point, RiskDecision, Thresholds } from "./types.js";

export const cambodiaScreeningBounds = {
  minLat: 9.45,
  maxLat: 15.1,
  minLng: 101.75,
  maxLng: 108.1
};

export function isWithinCambodiaScreeningBounds(point: Point): boolean {
  return point.lat >= cambodiaScreeningBounds.minLat &&
    point.lat <= cambodiaScreeningBounds.maxLat &&
    point.lng >= cambodiaScreeningBounds.minLng &&
    point.lng <= cambodiaScreeningBounds.maxLng;
}

export function parseCoordinateInput(value: string): Point | null {
  const match = value.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);

  if (isLatitude(first) && isLongitude(second)) return { lat: first, lng: second };
  if (isLongitude(first) && isLatitude(second)) return { lat: second, lng: first };
  return null;
}

export function normalizeThresholds(input: Partial<Thresholds>, defaults: Thresholds): Thresholds {
  const restrictedDistanceKm = Number(input.restrictedDistanceKm ?? defaults.restrictedDistanceKm);
  const cautionDistanceKm = Number(input.cautionDistanceKm ?? defaults.cautionDistanceKm);

  if (!Number.isFinite(restrictedDistanceKm) || restrictedDistanceKm < 0) {
    throw new Error("restrictedDistanceKm must be a positive number");
  }
  if (!Number.isFinite(cautionDistanceKm) || cautionDistanceKm < 0) {
    throw new Error("cautionDistanceKm must be a positive number");
  }
  if (cautionDistanceKm < restrictedDistanceKm) {
    throw new Error("cautionDistanceKm must be greater than or equal to restrictedDistanceKm");
  }

  return { restrictedDistanceKm, cautionDistanceKm };
}

export function decideRisk(distanceKm: number, inside: boolean, thresholds: Thresholds): RiskDecision {
  if (inside) {
    return {
      status: "restricted",
      decision: "Do not approve for construction-related lending"
    };
  }
  if (distanceKm <= thresholds.restrictedDistanceKm) {
    return {
      status: "near",
      decision: "Escalate for field and document verification"
    };
  }
  if (distanceKm <= thresholds.cautionDistanceKm) {
    return {
      status: "watch",
      decision: "Approve only with added land-use checks"
    };
  }
  return {
    status: "clear",
    decision: "Proceed with standard review"
  };
}

export function outOfScopeDecision(): RiskDecision {
  return {
    status: "out_of_scope",
    decision: "Location is outside the Cambodia screening area"
  };
}

function isLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
