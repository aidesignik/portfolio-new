import { NextResponse } from "next/server";
import { estimateTripDistance } from "@/lib/tripDistance";

// Intentionally public (no auth) — used by the anonymous landing-page search,
// not just the logged-in request form. Nominatim/OSRM calls are already
// throttled in src/lib/geocoding.ts.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pickupAddress = body?.pickupAddress;
  const destinationAddress = body?.destinationAddress;
  if (typeof pickupAddress !== "string" || typeof destinationAddress !== "string") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const estimate = await estimateTripDistance(pickupAddress, destinationAddress);
    if (!estimate) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(estimate);
  } catch {
    return NextResponse.json({ error: "ESTIMATE_FAILED" }, { status: 502 });
  }
}
