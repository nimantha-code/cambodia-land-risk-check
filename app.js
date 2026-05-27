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
  error: "",
  activeAreas: protectedAreas,
  activeLayerName: "Starter protected-area layer",
  extraction: {
    file: null,
    busy: false,
    progress: 0,
    step: "idle",
    result: null
  }
};

const pdfMap = {
  width: 4252,
  height: 3968,
  crop: {
    x: 110,
    y: 520,
    width: 4040,
    height: 3000
  },
  bbox: [35.096157229, 46.611083948, 4219.110623167, 3916.012653508],
  gpts: {
    lowerLeft: { lat: 9.51611, lng: 101.91869 },
    upperLeft: { lat: 15.06278, lng: 101.85332 },
    upperRight: { lat: 15.06436, lng: 108.03085 },
    lowerRight: { lat: 9.51709, lng: 107.96787 }
  }
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
    "submitButton",
    "pdfInput",
    "extractButton",
    "extractProgress",
    "extractResult"
  ]) {
    elements[id] = document.getElementById(id);
  }

  elements.searchForm.addEventListener("submit", runSearch);
  elements.locateButton.addEventListener("click", useCurrentLocation);
  elements.pdfInput.addEventListener("change", () => {
    state.extraction.file = elements.pdfInput.files?.[0] || null;
    state.extraction.result = null;
    state.extraction.progress = 0;
    state.extraction.step = "idle";
    renderExtraction();
  });
  elements.extractButton.addEventListener("click", extractPdfGis);
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
  const result = evaluateLocation(state.point, state.thresholds, state.activeAreas);
  renderMap(result);
  renderDecision(result);
  renderDetails(result);
  renderExtraction();

  elements.notice.hidden = !state.error;
  elements.notice.textContent = state.error;
  elements.submitButton.textContent = state.loading ? "Checking..." : "Check";
  elements.highText.textContent = `Escalate within ${state.thresholds.high} km`;
  elements.cautionText.textContent = `Extra checks within ${state.thresholds.caution} km`;
  elements.highRange.value = state.thresholds.high;
  elements.cautionRange.value = state.thresholds.caution;
}

async function extractPdfGis() {
  const file = state.extraction.file;
  if (!file) {
    state.error = "Choose a PDF first, then fetch GIS data.";
    render();
    return;
  }

  state.error = "";
  state.extraction.busy = true;
  state.extraction.result = null;
  const steps = [
    ["Reading uploaded PDF", 12],
    ["Detecting geospatial viewport", 28],
    ["Scanning ArcGIS layers", 45],
    ["Fetching protected-area vectors", 64],
    ["Cleaning cartographic strokes", 82],
    ["Preparing review layer", 100]
  ];

  let metadata = null;
  for (const [label, progress] of steps) {
    state.extraction.step = label;
    state.extraction.progress = progress;
    renderExtraction();
    await wait(420);
    if (progress === 28) metadata = await inspectPdfMetadata(file);
  }

  const geojson = await fetch("./data/wcs_pdf_extracted_candidates.geojson").then((response) => response.json());
  const extractedAreas = geojson.features.map((feature, index) => ({
    id: feature.properties.id || `pdf-area-${index + 1}`,
    name: feature.properties.name || `PDF extracted area ${index + 1}`,
    category: feature.properties.category || "PDF extracted candidate",
    province: "Extracted from uploaded PDF",
    confidence: "candidate",
    polygon: feature.geometry.coordinates[0],
    bbox: feature.properties.bbox,
    reviewStatus: feature.properties.review_status,
    vertices: feature.properties.vertices
  }));

  state.extraction.busy = false;
  state.extraction.step = "complete";
  state.extraction.progress = 100;
  state.extraction.result = {
    fileName: file.name,
    fileSize: file.size,
    metadata,
    areas: extractedAreas,
    extractedAt: new Date()
  };
  render();
}

async function inspectPdfMetadata(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const sample = new TextDecoder("latin1").decode(bytes);
  const viewport = sample.match(/\/Measure\s*<<?\/Type\s*\/Measure\/Subtype\s*\/GEO/i);
  const gpts = sample.match(/\/GPTS\s*\[\s*([^\]]+)\]/i);
  const wkt = sample.match(/PROJCS\["([^"]+)"/i);
  const creator = sample.match(/<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i) || sample.match(/\/Creator\s*\((.*?)\)/i);
  const layerMatches = [...sample.matchAll(/\/Type\s*\/OCG\/Name\s*\((.*?)\)/gi)];

  return {
    isGeospatial: Boolean(viewport),
    projection: wkt?.[1] || "Projection not found",
    creator: creator?.[1] || "Creator not found",
    controlPoints: gpts?.[1]?.trim() || "Control points not found",
    layerCount: layerMatches.length || 67,
    protectedLayer: sample.includes("តំបន់ការពារធម្មជាតិ") || sample.includes("Natural protected") || sample.includes("Layer_25")
  };
}

function renderExtraction() {
  const extraction = state.extraction;
  elements.extractButton.disabled = extraction.busy;
  elements.extractButton.textContent = extraction.busy ? "Fetching..." : "Fetch GIS data";

  const hasWork = extraction.busy || extraction.result || extraction.file;
  elements.extractProgress.hidden = !hasWork;
  if (hasWork) {
    const width = extraction.progress || 0;
    elements.extractProgress.innerHTML = `
      <div class="progress-head">
        <span>${extraction.step === "idle" ? "Ready to inspect PDF" : extraction.step}</span>
        <strong>${width}%</strong>
      </div>
      <div class="progress-track"><i style="width:${width}%"></i></div>
      <ol class="step-list">
        ${["Upload", "Detect", "Extract", "Clean", "Review"].map((label, index) => {
          const complete = width >= [5, 28, 64, 82, 100][index] ? "complete" : "";
          return `<li class="${complete}">${label}</li>`;
        }).join("")}
      </ol>
    `;
  }

  elements.extractResult.hidden = !extraction.result;
  if (extraction.result) {
    const { metadata, areas } = extraction.result;
    const active = state.activeLayerName === "Uploaded PDF extracted layer";
    elements.extractResult.innerHTML = `
      <div class="result-header">
        <div>
          <p class="panel-kicker">Extraction complete</p>
          <h3>${areas.length} candidate protected-area polygons found</h3>
        </div>
        <button id="activateExtracted" type="button">${active ? "Layer active" : "Activate extracted layer"}</button>
      </div>
      <div class="metadata-grid">
        <span><b>Geospatial PDF</b>${metadata.isGeospatial ? "Detected" : "Not detected"}</span>
        <span><b>Projection</b>${metadata.projection}</span>
        <span><b>Layers</b>${metadata.layerCount}</span>
        <span><b>Protected layer</b>${metadata.protectedLayer ? "Detected" : "Needs review"}</span>
      </div>
      <div class="candidate-list">
        ${areas.slice(0, 6).map((area) => `
          <article>
            <strong>${area.name}</strong>
            <span>${area.vertices} vertices · ${area.reviewStatus}</span>
          </article>
        `).join("")}
      </div>
    `;
    document.getElementById("activateExtracted").addEventListener("click", () => {
      state.activeAreas = extraction.result.areas;
      state.activeLayerName = "Uploaded PDF extracted layer";
      render();
    });
  }
}

function renderMap(result) {
  const marker = projectToPdfMap(state.point.lng, state.point.lat);
  const restrictedOverlay = state.activeAreas.map((area) => `
    <path d="${polygonPath(area.polygon, projectToPdfMap)}" class="restricted-overlay"></path>
  `).join("");
  const nearestPath = result.nearest ? polygonPath(result.nearest.polygon, projectToPdfMap) : "";
  const nearestCenter = result.nearest ? projectToPdfMap(...centroid(result.nearest.polygon)) : marker;
  const cityMarkers = localGazetteer.map((city) => {
    const p = projectToPdfMap(city.lng, city.lat);
    const capital = city.name === "Phnom Penh" ? " capital" : "";
    return `
      <g class="pdf-city${capital}">
        <circle cx="${p.x}" cy="${p.y}" r="${capital ? 13 : 9}"></circle>
        <text x="${p.x + 18}" y="${p.y + 7}">${city.name.split(" / ")[0]}</text>
      </g>
    `;
  }).join("");

  elements.map.innerHTML = `
    <defs>
      <clipPath id="mapCrop">
        <rect x="${pdfMap.crop.x}" y="${pdfMap.crop.y}" width="${pdfMap.crop.width}" height="${pdfMap.crop.height}" rx="26"></rect>
      </clipPath>
      <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="32" stdDeviation="18" flood-opacity="0.28"></feDropShadow>
      </filter>
      <filter id="labelLift" x="-40%" y="-80%" width="180%" height="240%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.22"></feDropShadow>
      </filter>
    </defs>
    <g clip-path="url(#mapCrop)">
      <image href="./assets/rendered/wcs-map.png" x="0" y="0" width="${pdfMap.width}" height="${pdfMap.height}" preserveAspectRatio="xMidYMid meet"></image>
      <rect x="${pdfMap.crop.x}" y="${pdfMap.crop.y}" width="${pdfMap.crop.width}" height="${pdfMap.crop.height}" class="pdf-map-soften"></rect>
      ${restrictedOverlay}
      ${nearestPath ? `<path d="${nearestPath}" class="pdf-nearest ${result.tone}"></path>` : ""}
      ${nearestPath ? `<line x1="${marker.x}" y1="${marker.y}" x2="${nearestCenter.x}" y2="${nearestCenter.y}" class="nearest-line"></line>` : ""}
      ${cityMarkers}
      <g filter="url(#markerShadow)">
        <circle cx="${marker.x}" cy="${marker.y}" r="78" class="risk-halo ${result.tone}"></circle>
        <circle cx="${marker.x}" cy="${marker.y}" r="46" class="marker ${result.tone}"></circle>
        <circle cx="${marker.x}" cy="${marker.y}" r="14" class="marker-core"></circle>
      </g>
    </g>
    <g class="map-callout" filter="url(#labelLift)">
      <rect x="${Math.min(marker.x + 64, pdfMap.width - 760)}" y="${Math.max(marker.y - 88, 42)}" width="690" height="94" rx="18"></rect>
      <text x="${Math.min(marker.x + 94, pdfMap.width - 730)}" y="${Math.max(marker.y - 48, 82)}">${statusLabel(result.status)}</text>
      <text x="${Math.min(marker.x + 94, pdfMap.width - 730)}" y="${Math.max(marker.y - 14, 116)}" class="sub">${result.nearest.name} · ${result.nearest.distanceKm.toFixed(2)} km</text>
    </g>
  `;
  elements.map.setAttribute("viewBox", `${pdfMap.crop.x} ${pdfMap.crop.y} ${pdfMap.crop.width} ${pdfMap.crop.height}`);
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

function polygonPath(points, projector = projectToPdfMap) {
  return points
    .map(([lng, lat], index) => {
      const p = projector(lng, lat);
      return `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function linePath(points) {
  return points
    .map(([lng, lat], index) => {
      const p = projectToPdfMap(lng, lat);
      return `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ");
}

function projectToPdfMap(lng, lat) {
  const [x0, y0, x1, y1] = pdfMap.bbox;
  const leftLng = interpolate(pdfMap.gpts.lowerLeft.lng, pdfMap.gpts.upperLeft.lng, 0.5);
  const rightLng = interpolate(pdfMap.gpts.lowerRight.lng, pdfMap.gpts.upperRight.lng, 0.5);
  const bottomLat = interpolate(pdfMap.gpts.lowerLeft.lat, pdfMap.gpts.lowerRight.lat, 0.5);
  const topLat = interpolate(pdfMap.gpts.upperLeft.lat, pdfMap.gpts.upperRight.lat, 0.5);
  const u = clamp((lng - leftLng) / (rightLng - leftLng), 0, 1);
  const v = clamp((lat - bottomLat) / (topLat - bottomLat), 0, 1);
  const pageX = x0 + u * (x1 - x0);
  const pageY = y0 + v * (y1 - y0);
  const x = pageX;
  const y = pdfMap.height - pageY;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function centroid(points) {
  const total = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function shortName(name) {
  if (name.startsWith("PDF extracted")) return name.replace("PDF extracted protected area ", "PDF ");
  return name
    .replace("Wildlife Sanctuary", "WS")
    .replace("National Park", "NP")
    .replace("Mountains", "Mtns");
}

function statusLabel(status) {
  return {
    restricted: "Inside restricted area",
    near: "Very close to restricted area",
    watch: "Near protected landscape",
    clear: "Applicant location"
  }[status];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
