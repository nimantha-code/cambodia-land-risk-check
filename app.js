import {
  cambodiaBounds,
  cambodiaOutline,
  localGazetteer,
  protectedAreas,
  rivers,
  roads,
  terrainBands,
  waterBodies
} from "./src/protectedAreas.js";
import { evaluateLocation, parseCoordinateInput } from "./src/riskEngine.js";

const state = {
  point: { lat: 12.4558, lng: 107.1881, label: "Mondulkiri / Sen Monorom" },
  thresholds: { high: 5, caution: 10 },
  loading: false,
  error: ""
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  for (const id of [
    "searchForm",
    "query",
    "locateButton",
    "notice",
    "map",
    "decision",
    "decisionIcon",
    "decisionTitle",
    "decisionText",
    "locationLabel",
    "coords",
    "nearestName",
    "nearestFacts",
    "highRange",
    "cautionRange",
    "highText",
    "cautionText",
    "submitButton"
  ]) {
    elements[id] = document.getElementById(id);
  }

  elements.searchForm.addEventListener("submit", runSearch);
  elements.locateButton.addEventListener("click", useCurrentLocation);
  elements.highRange.addEventListener("input", (event) => {
    state.thresholds.high = Number(event.target.value);
    state.thresholds.caution = Math.max(state.thresholds.caution, state.thresholds.high + 1);
    elements.cautionRange.value = state.thresholds.caution;
    render();
  });
  elements.cautionRange.addEventListener("input", (event) => {
    state.thresholds.caution = Math.max(Number(event.target.value), state.thresholds.high + 1);
    elements.cautionRange.value = state.thresholds.caution;
    render();
  });

  render();
});

async function runSearch(event) {
  event.preventDefault();
  const value = elements.query.value.trim();
  if (!value) return;

  state.error = "";
  const coordinate = parseCoordinateInput(value);
  if (coordinate) {
    state.point = coordinate;
    render();
    return;
  }

  const local = localGazetteer.find((item) => item.name.toLowerCase().includes(value.toLowerCase()));
  if (local) {
    state.point = { ...local, label: local.name };
    render();
    return;
  }

  state.loading = true;
  render();
  try {
    const params = new URLSearchParams({
      q: `${value}, Cambodia`,
      format: "jsonv2",
      limit: "1",
      countrycodes: "kh"
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: "application/json" }
    });
    const data = await response.json();

    if (!data.length) {
      state.error = "No Cambodia location found. Try a nearby town, village, or coordinates.";
      return;
    }

    state.point = {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name
    };
  } catch {
    state.error = "Online address lookup is unavailable. Enter coordinates like 12.4558, 107.1881.";
  } finally {
    state.loading = false;
    render();
  }
}

function useCurrentLocation() {
  state.error = "";
  if (!navigator.geolocation) {
    state.error = "This browser does not support location lookup.";
    render();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.point = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: "Current device location"
      };
      render();
    },
    () => {
      state.error = "Could not read current location. You can still enter coordinates manually.";
      render();
    },
    { enableHighAccuracy: true, timeout: 7000 }
  );
}

function render() {
  const result = evaluateLocation(state.point, state.thresholds);
  renderMap(result);
  renderDecision(result);
  renderDetails(result);

  elements.notice.hidden = !state.error;
  elements.notice.textContent = state.error;
  elements.submitButton.textContent = state.loading ? "Checking..." : "Check";
  elements.highText.textContent = `Escalate within ${state.thresholds.high} km`;
  elements.cautionText.textContent = `Extra checks within ${state.thresholds.caution} km`;
  elements.highRange.value = state.thresholds.high;
  elements.cautionRange.value = state.thresholds.caution;
}

function renderMap(result) {
  const marker = project(state.point.lng, state.point.lat);
  const terrainPaths = terrainBands
    .map((band) => `<path d="${polygonPath(band.polygon)}" class="terrain-band"></path>`)
    .join("");
  const waterPaths = waterBodies
    .map((water) => `<path d="${polygonPath(water.polygon)}" class="water-body"></path>`)
    .join("");
  const riverPaths = rivers
    .map((river) => `<path d="${linePath(river.points)}" class="river"></path>`)
    .join("");
  const roadPaths = roads
    .map((road) => `<path d="${linePath(road.points)}" class="road"></path>`)
    .join("");
  const cityMarkers = localGazetteer
    .map((city) => {
      const p = project(city.lng, city.lat);
      const capital = city.name === "Phnom Penh" ? " capital" : "";
      return `
        <g class="city${capital}">
          <circle cx="${p.x}" cy="${p.y}" r="${capital ? 6 : 4}"></circle>
          <text x="${p.x + 9}" y="${p.y + 4}">${city.name.split(" / ")[0]}</text>
        </g>
      `;
    })
    .join("");
  const areaPaths = protectedAreas
    .map((area) => {
      const active = result.nearest?.id === area.id ? ` active ${result.tone}` : "";
      const center = project(...centroid(area.polygon));
      return `
        <path d="${polygonPath(area.polygon)}" class="protected${active}"></path>
        <text x="${center.x}" y="${center.y}" class="area-label">${shortName(area.name)}</text>
      `;
    })
    .join("");

  elements.map.innerHTML = `
    <defs>
      <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8f4e7"></stop>
        <stop offset="50%" stop-color="#ecf0dc"></stop>
        <stop offset="100%" stop-color="#d9e4d2"></stop>
      </linearGradient>
      <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9fcee0"></stop>
        <stop offset="100%" stop-color="#5c9fb8"></stop>
      </linearGradient>
      <pattern id="mapGrid" width="86" height="86" patternUnits="userSpaceOnUse">
        <path d="M 86 0 L 0 0 0 86" class="grid-line"></path>
      </pattern>
      <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity="0.24"></feDropShadow>
      </filter>
    </defs>
    <rect width="1000" height="820" rx="28" class="map-bg"></rect>
    <rect width="1000" height="820" rx="28" fill="url(#mapGrid)" opacity="0.45"></rect>
    <path d="${polygonPath(cambodiaOutline)}" class="country"></path>
    <clipPath id="countryClip"><path d="${polygonPath(cambodiaOutline)}"></path></clipPath>
    <g clip-path="url(#countryClip)">
      ${terrainPaths}
      ${waterPaths}
      ${riverPaths}
      ${roadPaths}
    </g>
    ${areaPaths}
    ${cityMarkers}
    <g filter="url(#markerShadow)">
      <circle cx="${marker.x}" cy="${marker.y}" r="19" class="marker ${result.tone}"></circle>
      <circle cx="${marker.x}" cy="${marker.y}" r="6" class="marker-core"></circle>
    </g>
    <text x="84" y="762" class="scale-label">0</text>
    <path d="M 106 755 L 246 755" class="scale-line"></path>
    <text x="258" y="762" class="scale-label">~100 km</text>
  `;
}

function renderDecision(result) {
  const title = {
    restricted: "Inside restricted area",
    near: "Very close to restricted area",
    watch: "Near protected landscape",
    clear: "No nearby restriction detected"
  }[result.status];

  elements.decision.className = `decision ${result.tone}`;
  elements.decisionIcon.textContent = result.status === "clear" ? "✓" : "!";
  elements.decisionTitle.textContent = title;
  elements.decisionText.textContent = result.decision;
}

function renderDetails(result) {
  elements.locationLabel.textContent = state.point.label;
  elements.coords.innerHTML = `
    <span>${state.point.lat.toFixed(5)} lat</span>
    <span>${state.point.lng.toFixed(5)} lng</span>
  `;
  elements.nearestName.textContent = result.nearest.name;
  elements.nearestFacts.innerHTML = `
    <div><dt>Distance</dt><dd>${result.nearest.distanceKm.toFixed(2)} km</dd></div>
    <div><dt>Type</dt><dd>${result.nearest.category}</dd></div>
    <div><dt>Province</dt><dd>${result.nearest.province}</dd></div>
  `;
}

function polygonPath(points) {
  return points
    .map(([lng, lat], index) => {
      const p = project(lng, lat);
      return `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function linePath(points) {
  return points
    .map(([lng, lat], index) => {
      const p = project(lng, lat);
      return `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ");
}

function project(lng, lat) {
  const padding = 70;
  const width = 1000 - padding * 2;
  const height = 820 - padding * 2;
  const x = padding + ((lng - cambodiaBounds.minLng) / (cambodiaBounds.maxLng - cambodiaBounds.minLng)) * width;
  const y = padding + ((cambodiaBounds.maxLat - lat) / (cambodiaBounds.maxLat - cambodiaBounds.minLat)) * height;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

function centroid(points) {
  const total = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function shortName(name) {
  return name
    .replace("Wildlife Sanctuary", "WS")
    .replace("National Park", "NP")
    .replace("Mountains", "Mtns");
}
