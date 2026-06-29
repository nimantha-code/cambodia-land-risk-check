export type AppConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  apiKeyPepper: string;
  adminApiKey: string;
  allowedOrigins: string[];
  defaultRestrictedDistanceKm: number;
  defaultCautionDistanceKm: number;
  geocoderProvider: "local" | "nominatim" | "disabled";
  geocoderBaseUrl: string;
  geocoderUserAgent: string;
};

export function loadConfig(env = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV || "development",
    host: env.HOST || "0.0.0.0",
    port: Number(env.PORT || 8080),
    databaseUrl: required(env.DATABASE_URL, "DATABASE_URL"),
    apiKeyPepper: required(env.API_KEY_PEPPER, "API_KEY_PEPPER"),
    adminApiKey: required(env.ADMIN_API_KEY, "ADMIN_API_KEY"),
    allowedOrigins: splitCsv(env.ALLOWED_ORIGINS || ""),
    defaultRestrictedDistanceKm: Number(env.DEFAULT_RESTRICTED_DISTANCE_KM || 5),
    defaultCautionDistanceKm: Number(env.DEFAULT_CAUTION_DISTANCE_KM || 10),
    geocoderProvider: parseGeocoderProvider(env.GEOCODER_PROVIDER || "local"),
    geocoderBaseUrl: env.GEOCODER_BASE_URL || "https://nominatim.openstreetmap.org",
    geocoderUserAgent: env.GEOCODER_USER_AGENT || "CambodiaLandRiskAPI/0.1"
  };
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

function splitCsv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseGeocoderProvider(value: string): AppConfig["geocoderProvider"] {
  if (value === "local" || value === "nominatim" || value === "disabled") return value;
  throw new Error(`Unsupported GEOCODER_PROVIDER: ${value}`);
}
