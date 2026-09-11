import type { Coordinates } from "./distance";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Nominatim's usage policy requires a descriptive User-Agent and caps public
// usage at ~1 request/second — this app is low-traffic, so a simple module-
// level throttle is enough (no queue/backoff infra needed for this volume).
const USER_AGENT = "atlas-transport-mvp/1.0 (dev contact: see repository)";
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

/**
 * Free, keyless geocoding via OpenStreetMap Nominatim. Public demo
 * infrastructure — fine for this MVP's traffic, not meant for heavy
 * production load (swap for a paid provider behind this same signature
 * if that's ever needed).
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  await throttle();

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return null;

  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  if (!first) return null;

  return { lat: Number(first.lat), lng: Number(first.lon) };
}
