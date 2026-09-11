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
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    geocodeCache.set(key, null);
    return null;
  }

  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  const coords = first ? { lat: Number(first.lat), lng: Number(first.lon) } : null;
  geocodeCache.set(key, coords);
  return coords;
}
