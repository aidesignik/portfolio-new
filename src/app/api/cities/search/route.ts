import { NextResponse } from "next/server";
import { searchCities } from "@/lib/citySearch";

// Backs the city-suggestion dropdown (CityCombobox) on both the carrier
// and client-facing forms. Public: city names aren't sensitive, and the
// client request form needs this before a visitor has an account — same
// reasoning as the public /api/distance endpoint. The search itself is a
// synchronous in-memory lookup (see citySearch.ts), so this stays fast
// without needing to await anything external.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const cities = searchCities(q);
  return NextResponse.json({ cities });
}
