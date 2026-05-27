import { protectedAreas } from "./protectedAreas.js";

const EARTH_RADIUS_KM = 6371.0088;

export function parseCoordinateInput(value) {
  const match = value
    .trim()
    .match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);

  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);

  if (Math.abs(first) <= 14.9 && Math.abs(second) >= 100) {
    return { lat: first, lng: second, label: `${first.toFixed(5)}, ${second.toFixed(5)}` };
  }

  if (Math.abs(second) <= 14.9 && Math.abs(first) >= 100) {
    return { lat: second, lng: first, label: `${second.toFixed(5)}, ${first.toFixed(5)}` };
  }

  return null;
}

export function evaluateLocation(point, thresholds = { high: 5, caution: 10 }, areas = protectedAreas) {
  const matches = areas.map((area) => {
    const inside = isPointInPolygon([point.lng, point.lat], area.polygon);
    const distanceKm = inside ? 0 : distanceToPolygonKm(point, area.polygon);
    return { ...area, inside, distanceKm };
  });

  matches.sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = matches[0];

  let status = "clear";
  let decision = "Proceed with standard review";
  let tone = "green";

  if (nearest?.inside) {
    status = "restricted";
    decision = "Do not approve for construction-related lending";
    tone = "red";
  } else if (nearest?.distanceKm <= thresholds.high) {
    status = "near";
    decision = "Escalate for field and document verification";
    tone = "amber";
  } else if (nearest?.distanceKm <= thresholds.caution) {
    status = "watch";
    decision = "Approve only with added land-use checks";
    tone = "yellow";
  }

  return {
    status,
    decision,
    tone,
    nearest,
    matches: matches.slice(0, 4)
  };
}

function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function distanceToPolygonKm(point, polygon) {
  let min = Infinity;
  for (let i = 0; i < polygon.length - 1; i++) {
    min = Math.min(min, distanceToSegmentKm(point, polygon[i], polygon[i + 1]));
  }
  return min;
}

function distanceToSegmentKm(point, a, b) {
  const latScale = 111.32;
  const lngScale = 111.32 * Math.cos(toRad(point.lat));
  const px = point.lng * lngScale;
  const py = point.lat * latScale;
  const ax = a[0] * lngScale;
  const ay = a[1] * latScale;
  const bx = b[0] * lngScale;
  const by = b[1] * latScale;
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) return haversineKm(point, { lng: a[0], lat: a[1] });

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const nearest = { x: ax + t * dx, y: ay + t * dy };
  return Math.hypot(px - nearest.x, py - nearest.y);
}

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
