import test from "node:test";
import assert from "node:assert/strict";
import { decideRisk, isWithinCambodiaScreeningBounds, normalizeThresholds, parseCoordinateInput } from "../src/domain.js";

test("parses Cambodia coordinates in lat,lng order", () => {
  assert.deepEqual(parseCoordinateInput("13.3671, 103.8448"), { lat: 13.3671, lng: 103.8448 });
});

test("parses coordinates in lng,lat order", () => {
  assert.deepEqual(parseCoordinateInput("103.8448, 13.3671"), { lat: 13.3671, lng: 103.8448 });
});

test("detects Cambodia screening bounds", () => {
  assert.equal(isWithinCambodiaScreeningBounds({ lat: 11.5564, lng: 104.9282 }), true);
  assert.equal(isWithinCambodiaScreeningBounds({ lat: 6.9271, lng: 79.8612 }), false);
});

test("normalizes valid thresholds", () => {
  assert.deepEqual(
    normalizeThresholds({ restrictedDistanceKm: 6 }, { restrictedDistanceKm: 5, cautionDistanceKm: 10 }),
    { restrictedDistanceKm: 6, cautionDistanceKm: 10 }
  );
});

test("rejects caution threshold lower than restricted threshold", () => {
  assert.throws(
    () => normalizeThresholds({ restrictedDistanceKm: 8, cautionDistanceKm: 3 }, { restrictedDistanceKm: 5, cautionDistanceKm: 10 }),
    /cautionDistanceKm/
  );
});

test("maps inside area to restricted decision", () => {
  assert.deepEqual(decideRisk(0, true, { restrictedDistanceKm: 5, cautionDistanceKm: 10 }), {
    status: "restricted",
    decision: "Do not approve for construction-related lending"
  });
});

test("maps near area to escalation decision", () => {
  assert.deepEqual(decideRisk(4.9, false, { restrictedDistanceKm: 5, cautionDistanceKm: 10 }), {
    status: "near",
    decision: "Escalate for field and document verification"
  });
});

test("maps watch area to added-checks decision", () => {
  assert.deepEqual(decideRisk(8, false, { restrictedDistanceKm: 5, cautionDistanceKm: 10 }), {
    status: "watch",
    decision: "Approve only with added land-use checks"
  });
});

test("maps clear area to standard review decision", () => {
  assert.deepEqual(decideRisk(25, false, { restrictedDistanceKm: 5, cautionDistanceKm: 10 }), {
    status: "clear",
    decision: "Proceed with standard review"
  });
});
