const demoGazetteer = [
  { name: "Phnom Penh", lat: 11.5564, lng: 104.9282 },
  { name: "Siem Reap", lat: 13.3671, lng: 103.8448 },
  { name: "Battambang", lat: 13.0957, lng: 103.2022 },
  { name: "Sihanoukville", lat: 10.6253, lng: 103.5234 },
  { name: "Kampong Thom", lat: 12.7111, lng: 104.8887 },
  { name: "Kratie", lat: 12.4881, lng: 106.0188 },
  { name: "Mondulkiri / Sen Monorom", lat: 12.4558, lng: 107.1881 },
  { name: "Ratanakiri / Banlung", lat: 13.7394, lng: 106.9873 },
  { name: "Koh Kong", lat: 11.6175, lng: 102.9806 },
  { name: "Stung Treng", lat: 13.5259, lng: 105.9683 },
  { name: "Preah Vihear", lat: 13.8073, lng: 104.9805 },
  { name: "Pursat", lat: 12.5388, lng: 103.9192 }
];

const demoAreas = [
  {
    name: "Keo Seima Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Mondulkiri / Kratie",
    polygon: [[106.55, 12.9], [107.1, 12.95], [107.36, 12.64], [107.28, 12.2], [106.86, 11.84], [106.45, 12.04], [106.32, 12.46], [106.55, 12.9]]
  },
  {
    name: "Phnom Prich Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Mondulkiri",
    polygon: [[105.95, 13.05], [106.55, 13.1], [106.83, 12.76], [106.7, 12.3], [106.2, 12.13], [105.86, 12.45], [105.95, 13.05]]
  },
  {
    name: "Lomphat Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Ratanakiri / Mondulkiri",
    polygon: [[106.58, 13.7], [107.16, 13.63], [107.31, 13.18], [106.92, 12.9], [106.48, 13.06], [106.35, 13.45], [106.58, 13.7]]
  },
  {
    name: "Virachey National Park",
    category: "National park",
    province: "Ratanakiri / Stung Treng",
    polygon: [[106.45, 14.45], [107.4, 14.42], [107.52, 14.08], [107.1, 13.82], [106.45, 13.95], [106.45, 14.45]]
  },
  {
    name: "Prey Lang Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Kampong Thom / Kratie / Stung Treng / Preah Vihear",
    polygon: [[104.65, 13.45], [105.55, 13.42], [105.92, 13.04], [105.72, 12.55], [105.18, 12.2], [104.58, 12.38], [104.35, 12.95], [104.65, 13.45]]
  },
  {
    name: "Kulen Promtep Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Preah Vihear / Oddar Meanchey / Siem Reap",
    polygon: [[103.95, 14.35], [104.86, 14.32], [105.1, 13.82], [104.55, 13.42], [103.85, 13.68], [103.72, 14.08], [103.95, 14.35]]
  },
  {
    name: "Central Cardamom Mountains National Park",
    category: "National park",
    province: "Koh Kong / Pursat / Kampong Speu",
    polygon: [[102.75, 12.18], [103.62, 12.42], [104.15, 12.08], [104.08, 11.45], [103.42, 11.05], [102.82, 11.3], [102.58, 11.82], [102.75, 12.18]]
  },
  {
    name: "Botum Sakor National Park",
    category: "National park",
    province: "Koh Kong",
    polygon: [[103.05, 11.3], [103.78, 11.22], [103.94, 10.82], [103.5, 10.55], [103.05, 10.66], [102.9, 10.98], [103.05, 11.3]]
  }
];

const demoState = {
  point: { lat: 12.4558, lng: 107.1881, label: "Mondulkiri / Sen Monorom" },
  thresholds: { high: 5, caution: 10 },
  loading: false,
  error: ""
};

const pdfMap = {
  height: 3968,
  bbox: [35.096157229, 46.611083948, 4219.110623167, 3916.012653508],
  gpts: {
    lowerLeft: { lat: 9.51611, lng: 101.91869 },
    upperLeft: { lat: 15.06278, lng: 101.85332 },
    upperRight: { lat: 15.06436, lng: 108.03085 },
    lowerRight: { lat: 9.51709, lng: 107.96787 }
  }
};

const ui = {};

document.addEventListener("DOMContentLoaded", () => {
  [
    "searchForm",
    "query",
    "notice",
    "submitButton",
    "locateButton",
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
    "pdfInput",
    "extractButton",
    "extractProgress",
    "extractResult",
    "applicantHalo",
    "applicantPin",
    "applicantCore"
  ].forEach((id) => {
    ui[id] = document.getElementById(id);
  });

  ui.searchForm.addEventListener("submit", runDemoSearch);
  ui.locateButton.addEventListener("click", useDemoLocation);
  ui.highRange.addEventListener("input", (event) => {
    demoState.thresholds.high = Number(event.target.value);
    demoState.thresholds.caution = Math.max(demoState.thresholds.caution, demoState.thresholds.high + 1);
    ui.cautionRange.value = demoState.thresholds.caution;
    renderDemo();
  });
  ui.cautionRange.addEventListener("input", (event) => {
    demoState.thresholds.caution = Math.max(Number(event.target.value), demoState.thresholds.high + 1);
    ui.cautionRange.value = demoState.thresholds.caution;
    renderDemo();
  });
  ui.extractButton.addEventListener("click", runDemoExtraction);

  renderDemo();
});

async function runDemoSearch(event) {
  event.preventDefault();
  const value = ui.query.value.trim();
  if (!value) return;

  demoState.error = "";
  const coordinate = parseDemoCoordinate(value);
  if (coordinate) {
    demoState.point = coordinate;
    renderDemo();
    return;
  }

  const local = demoGazetteer.find((item) => item.name.toLowerCase().includes(value.toLowerCase()));
  if (local) {
    demoState.point = { ...local, label: local.name };
    renderDemo();
    return;
  }

  demoState.loading = true;
  renderDemo();
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
      demoState.error = "No Cambodia location found. Try a nearby town, village, or coordinates.";
      return;
    }
    demoState.point = {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name
    };
  } catch {
    demoState.error = "Online address lookup is unavailable. Try a known city or coordinates like 12.4558, 107.1881.";
  } finally {
    demoState.loading = false;
    renderDemo();
  }
}

function useDemoLocation() {
  demoState.error = "";
  if (!navigator.geolocation) {
    demoState.error = "This browser does not support location lookup.";
    renderDemo();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      demoState.point = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: "Current device location"
      };
      renderDemo();
    },
    () => {
      demoState.error = "Could not read current location. You can still enter coordinates manually.";
      renderDemo();
    },
    { enableHighAccuracy: true, timeout: 7000 }
  );
}

async function runDemoExtraction() {
  const file = ui.pdfInput.files?.[0];
  if (!file) {
    demoState.error = "Choose a PDF first, then fetch GIS data.";
    renderDemo();
    return;
  }

  demoState.error = "";
  const steps = [
    ["Reading uploaded PDF", 12],
    ["Detecting geospatial viewport", 28],
    ["Scanning ArcGIS layers", 45],
    ["Fetching protected-area vectors", 64],
    ["Cleaning cartographic strokes", 82],
    ["Preparing review layer", 100]
  ];

  ui.extractProgress.hidden = false;
  ui.extractResult.hidden = true;
  ui.extractButton.disabled = true;
  ui.extractButton.textContent = "Fetching...";

  for (const [label, progress] of steps) {
    ui.extractProgress.innerHTML = progressMarkup(label, progress);
    await wait(360);
  }

  ui.extractButton.disabled = false;
  ui.extractButton.textContent = "Fetch GIS data";
  ui.extractResult.hidden = false;
  ui.extractResult.innerHTML = `
    <div class="result-header">
      <div>
        <p class="panel-kicker">Extraction complete</p>
        <h3>49 candidate protected-area polygons found</h3>
      </div>
      <button type="button">Layer active</button>
    </div>
    <div class="metadata-grid">
      <span><b>Geospatial PDF</b>Detected</span>
      <span><b>Projection</b>WGS 1984 UTM Zone 48N</span>
      <span><b>Layers</b>67</span>
      <span><b>Protected layer</b>Detected</span>
    </div>
  `;
}

function renderDemo() {
  const result = evaluateDemoLocation(demoState.point);
  const title = {
    restricted: "Inside restricted area",
    near: "Very close to restricted area",
    watch: "Near protected landscape",
    clear: "No nearby restriction detected"
  }[result.status];

  ui.decision.className = `decision ${result.tone}`;
  ui.decisionIcon.textContent = result.status === "clear" ? "✓" : "!";
  ui.decisionTitle.textContent = title;
  ui.decisionText.textContent = result.decision;
  ui.locationLabel.textContent = demoState.point.label;
  ui.coords.innerHTML = `
    <span>${demoState.point.lat.toFixed(5)} lat</span>
    <span>${demoState.point.lng.toFixed(5)} lng</span>
  `;
  ui.nearestName.textContent = result.nearest.name;
  ui.nearestFacts.innerHTML = `
    <div><dt>Distance</dt><dd>${result.nearest.distanceKm.toFixed(2)} km</dd></div>
    <div><dt>Type</dt><dd>${result.nearest.category}</dd></div>
    <div><dt>Province</dt><dd>${result.nearest.province}</dd></div>
  `;
  ui.notice.hidden = !demoState.error;
  ui.notice.textContent = demoState.error;
  ui.submitButton.textContent = demoState.loading ? "Checking..." : "Check";
  ui.highText.textContent = `Escalate within ${demoState.thresholds.high} km`;
  ui.cautionText.textContent = `Extra checks within ${demoState.thresholds.caution} km`;
  ui.highRange.value = demoState.thresholds.high;
  ui.cautionRange.value = demoState.thresholds.caution;
  updateDemoMarker(result);
}

function evaluateDemoLocation(point) {
  const matches = demoAreas.map((area) => {
    const inside = isPointInPolygon([point.lng, point.lat], area.polygon);
    const distanceKm = inside ? 0 : distanceToPolygonKm(point, area.polygon);
    return { ...area, inside, distanceKm };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = matches[0];
  let status = "clear";
  let decision = "Proceed with standard review";
  let tone = "green";

  if (nearest.inside) {
    status = "restricted";
    decision = "Do not approve for construction-related lending";
    tone = "red";
  } else if (nearest.distanceKm <= demoState.thresholds.high) {
    status = "near";
    decision = "Escalate for field and document verification";
    tone = "amber";
  } else if (nearest.distanceKm <= demoState.thresholds.caution) {
    status = "watch";
    decision = "Approve only with added land-use checks";
    tone = "yellow";
  }

  return { status, decision, tone, nearest };
}

function parseDemoCoordinate(value) {
  const match = value.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
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

function updateDemoMarker(result) {
  const marker = projectToPdfMap(demoState.point.lng, demoState.point.lat);
  [ui.applicantHalo, ui.applicantPin, ui.applicantCore].forEach((element) => {
    if (!element) return;
    element.setAttribute("cx", marker.x);
    element.setAttribute("cy", marker.y);
  });

  if (ui.applicantHalo) ui.applicantHalo.setAttribute("class", `risk-halo ${result.tone}`);
  if (ui.applicantPin) ui.applicantPin.setAttribute("class", `marker ${result.tone}`);
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
  return {
    x: Number(pageX.toFixed(2)),
    y: Number((pdfMap.height - pageY).toFixed(2))
  };
}

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  const lngScale = 111.32 * Math.cos((point.lat * Math.PI) / 180);
  const px = point.lng * lngScale;
  const py = point.lat * latScale;
  const ax = a[0] * lngScale;
  const ay = a[1] * latScale;
  const bx = b[0] * lngScale;
  const by = b[1] * latScale;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function progressMarkup(label, progress) {
  return `
    <div class="progress-head">
      <span>${label}</span>
      <strong>${progress}%</strong>
    </div>
    <div class="progress-track"><i style="width:${progress}%"></i></div>
    <ol class="step-list">
      ${["Upload", "Detect", "Extract", "Clean", "Review"].map((step, index) => {
        const complete = progress >= [5, 28, 64, 82, 100][index] ? "complete" : "";
        return `<li class="${complete}">${step}</li>`;
      }).join("")}
    </ol>
  `;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
