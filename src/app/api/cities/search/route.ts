import { NextResponse } from "next/server";
import { searchCities } from "@/lib/geocoding";

// Backs the live city-suggestion dropdown (CityCombobox) on both the
// carrier and client-facing forms. Public: city names aren't sensitive,
// and the client request form needs this before a visitor has an account —
// same reasoning as the public /api/distance endpoint.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const cities = await searchCities(q);
  return NextResponse.json({ cities });
}
