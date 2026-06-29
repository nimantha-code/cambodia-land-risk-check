import type { AppConfig } from "../config.js";
import { parseCoordinateInput } from "../domain.js";
import type { ResolvedLocation } from "../types.js";

const localGazetteer = [
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

export async function resolveLocation(config: AppConfig, input: {
  address?: string;
  lat?: number;
  lng?: number;
}): Promise<{ location: ResolvedLocation | null; warnings: string[] }> {
  const warnings: string[] = [];

  if (typeof input.lat === "number" && typeof input.lng === "number") {
    return {
      location: {
        lat: input.lat,
        lng: input.lng,
        label: `${input.lat.toFixed(5)}, ${input.lng.toFixed(5)}`,
        inputType: "coordinates"
      },
      warnings
    };
  }

  const address = input.address?.trim();
  if (!address) return { location: null, warnings: ["Provide either address or lat/lng"] };

  const coordinate = parseCoordinateInput(address);
  if (coordinate) {
    return {
      location: {
        ...coordinate,
        label: `${coordinate.lat.toFixed(5)}, ${coordinate.lng.toFixed(5)}`,
        inputType: "coordinates"
      },
      warnings
    };
  }

  const local = localGazetteer.find((item) => item.name.toLowerCase().includes(address.toLowerCase()));
  if (local) {
    return {
      location: { ...local, label: local.name, inputType: "address", geocoder: "local" },
      warnings
    };
  }

  if (config.geocoderProvider === "disabled" || config.geocoderProvider === "local") {
    return { location: null, warnings: [`Address was not found in the local Cambodia gazetteer: ${address}`] };
  }

  return geocodeWithNominatim(config, address);
}

async function geocodeWithNominatim(config: AppConfig, address: string): Promise<{ location: ResolvedLocation | null; warnings: string[] }> {
  const params = new URLSearchParams({
    q: `${address}, Cambodia`,
    format: "jsonv2",
    limit: "1",
    countrycodes: "kh"
  });
  const response = await fetch(`${config.geocoderBaseUrl}/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": config.geocoderUserAgent
    }
  });
  if (!response.ok) {
    return { location: null, warnings: [`Geocoder returned HTTP ${response.status}`] };
  }

  const data = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) {
    return { location: null, warnings: [`No Cambodia address match found for: ${address}`] };
  }

  return {
    location: {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name,
      inputType: "address",
      geocoder: "nominatim"
    },
    warnings: []
  };
}
