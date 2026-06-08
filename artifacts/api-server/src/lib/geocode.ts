import { logger } from "./logger";

export interface GeocodeInput {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "IDA-Immobilier/1.0 (real-estate listing geocoder)";

// Nominatim's acceptable-use policy allows max ~1 request/second. We serialize
// outbound requests through a promise chain and enforce a minimum interval so
// bursty property edits never exceed the limit.
const MIN_REQUEST_INTERVAL_MS = 1100;
let lastRequestAt = 0;
let requestChain: Promise<unknown> = Promise.resolve();

function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  const run = requestChain.then(async () => {
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  // Keep the chain alive even if a request rejects.
  requestChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// Cache resolved addresses for the process lifetime — identical addresses
// (e.g. several listings in the same building) reuse one lookup.
const cache = new Map<string, GeocodeResult | null>();

/** True only when both coordinates are finite numbers. */
export function hasValidCoords(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

/**
 * Geocode a French property address into latitude/longitude using the free
 * OpenStreetMap Nominatim API (no API key required). Tries a structured query
 * first (most accurate), then falls back to a free-form query, then to just the
 * postal code + city so we almost always get an approximate location.
 *
 * Returns null if nothing could be resolved or the request failed — callers
 * should treat geocoding as best-effort and never block property creation on it.
 */
export async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  const country = input.country?.trim() || "France";

  const attempts: Record<string, string>[] = [];

  // 1. Structured query (street + postcode + city) — most precise.
  if (input.address?.trim() || (input.postalCode?.trim() && input.city?.trim())) {
    const structured: Record<string, string> = { country };
    if (input.address?.trim()) structured.street = input.address.trim();
    if (input.postalCode?.trim()) structured.postalcode = input.postalCode.trim();
    if (input.city?.trim()) structured.city = input.city.trim();
    attempts.push(structured);
  }

  // 2. Free-form query of the full address line.
  const freeForm = [input.address, input.postalCode, input.city, country]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  if (freeForm) attempts.push({ q: freeForm });

  // 3. Postal code + city only — coarse but reliable fallback.
  if (input.postalCode?.trim() || input.city?.trim()) {
    const coarse = [input.postalCode, input.city, country]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(", ");
    if (coarse && coarse !== freeForm) attempts.push({ q: coarse });
  }

  if (attempts.length === 0) return null;

  const cacheKey = JSON.stringify(attempts);
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  let result: GeocodeResult | null = null;
  for (const params of attempts) {
    try {
      const found = await rateLimited(async () => {
        const url = new URL(NOMINATIM_URL);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "1");
        url.searchParams.set("addressdetails", "0");
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value);
        }

        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr" },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          logger.warn({ status: res.status, params }, "Geocoding request failed");
          return null;
        }

        const results = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { latitude: lat, longitude: lon };
          }
        }
        return null;
      });

      if (found) {
        result = found;
        break;
      }
    } catch (err) {
      logger.warn({ err, params }, "Geocoding attempt errored");
    }
  }

  cache.set(cacheKey, result);
  return result;
}
