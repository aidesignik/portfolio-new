import type { Coordinates } from "./distance";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Nominatim's usage policy requires a descriptive User-Agent and caps public
// usage at ~1 request/second — this app is low-traffic, so a simple module-
// level throttle is enough (no queue/backoff infra needed for this volume).
const USER_AGENT = "atlas-transport-mvp/1.0 (dev contact: see repository)";
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;
// Chains every call onto the previous one so concurrent callers (e.g. a
// route with several waypoints geocoded via Promise.all) still serialize
// through the throttle instead of racing past it.
let throttleQueue: Promise<void> = Promise.resolve();

function throttle(): Promise<void> {
  const next = throttleQueue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
  });
  throttleQueue = next.catch(() => {});
  return next;
}

const geocodeCache = new Map<string, Coordinates | null>();

/**
 * Free, keyless geocoding via OpenStreetMap Nominatim. Public demo
 * infrastructure — fine for this MVP's traffic, not meant for heavy
 * production load (swap for a paid provider behind this same signature
 * if that's ever needed). Results are cached in-process by address string.
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  await throttle();

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
  } catch (err) {
    // A network-level failure (DNS, timeout, connection refused) throws
    // rather than resolving with a non-ok response — caught here so a
    // flaky/unreachable Nominatim degrades to "couldn't geocode" instead
    // of an unhandled exception further up the call chain.
    console.warn(`[geocoding] fetch failed for "${address}":`, err);
    return null;
  }
  if (!res.ok) {
    console.warn(`[geocoding] Nominatim returned ${res.status} for "${address}"`);
    geocodeCache.set(key, null);
    return null;
  }

  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  const coords = first ? { lat: Number(first.lat), lng: Number(first.lon) } : null;
  geocodeCache.set(key, coords);
  return coords;
}

export interface CitySuggestion {
  /** What to show in the dropdown and store as the city value if picked. */
  display: string;
}

/**
 * Live city/town search via Nominatim, backing the city-field suggestion
 * dropdown (replaces the old static Serbia-only list) — lets a carrier or
 * client find any town or city worldwide, not just a fixed set. Goes
 * through the same throttle/User-Agent as geocodeAddress() since it hits
 * the same rate-limited endpoint. Domestic (Serbian) results are shown
 * bare ("Beograd"); everything else gets the country appended
 * ("Paris, France") since that's the case where disambiguation actually
 * matters for this app's mostly-Serbian user base.
 */
export async function searchCities(query: string): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  await throttle();

  const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=8&featureType=settlement&q=${encodeURIComponent(q)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
  } catch (err) {
    console.warn(`[geocoding] city search fetch failed for "${q}":`, err);
    return [];
  }
  if (!res.ok) {
    console.warn(`[geocoding] Nominatim city search returned ${res.status} for "${q}"`);
    return [];
  }

  const results = (await res.json()) as Array<{
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      country?: string;
      country_code?: string;
    };
  }>;

  const seen = new Set<string>();
  const suggestions: CitySuggestion[] = [];
  for (const result of results) {
    const address = result.address;
    const place = address?.city ?? address?.town ?? address?.village ?? address?.municipality;
    if (!place) continue;
    const display =
      !address?.country || address.country_code === "rs" ? place : `${place}, ${address.country}`;
    if (seen.has(display)) continue;
    seen.add(display);
    suggestions.push({ display });
  }
  return suggestions;
}
