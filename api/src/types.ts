export type Point = {
  lat: number;
  lng: number;
};

export type ResolvedLocation = Point & {
  label: string;
  inputType: "coordinates" | "address";
  geocoder?: string;
};

export type Thresholds = {
  restrictedDistanceKm: number;
  cautionDistanceKm: number;
};

export type DecisionStatus = "restricted" | "near" | "watch" | "clear" | "out_of_scope" | "error";

export type RiskDecision = {
  status: DecisionStatus;
  decision: string;
};

export type ApiClient = {
  id: string;
  name: string;
  rateLimitPerMinute: number;
};

export type ActiveDataset = {
  id: string;
  version: string;
  source: string;
  featureCount: number;
  uploadedAt: string;
  activatedAt: string | null;
  metadata: Record<string, unknown>;
};

export type NearestArea = {
  id: string;
  externalId: string | null;
  name: string;
  category: string;
  province: string | null;
  distanceKm: number;
  inside: boolean;
};

export type RiskCheckResult = {
  checkId: string;
  status: DecisionStatus;
  decision: string;
  location: ResolvedLocation | null;
  nearestAreas: NearestArea[];
  distanceKm: number | null;
  dataset: ActiveDataset | null;
  thresholds: Thresholds;
  warnings: string[];
  checkedAt: string;
};
