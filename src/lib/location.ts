export interface CityLocation {
  city: string;
  location: string;
}

/** Combines a city + exact location (hotel, stop, address) into one display/geocoding string. */
export function formatLocation({ city, location }: CityLocation): string {
  return location ? `${location}, ${city}` : city;
}

export interface RouteLike {
  pickupCity: string;
  pickupLocation: string;
  destinationCity: string;
  destinationLocation: string;
  stops?: CityLocation[];
}

/** Compact single-line route summary, e.g. "Hotel Moskva, Beograd → Niš → Autobuska stanica, Novi Sad". */
export function formatRoute(route: RouteLike): string {
  const parts = [
    formatLocation({ city: route.pickupCity, location: route.pickupLocation }),
    ...(route.stops ?? []).map(formatLocation),
    formatLocation({ city: route.destinationCity, location: route.destinationLocation }),
  ];
  return parts.join(" → ");
}

export const COMMON_CITIES = [
  "Beograd",
  "Novi Sad",
  "Niš",
  "Kragujevac",
  "Subotica",
  "Zrenjanin",
  "Pančevo",
  "Čačak",
  "Kruševac",
  "Kraljevo",
  "Novi Pazar",
  "Smederevo",
  "Leskovac",
  "Valjevo",
  "Vranje",
  "Šabac",
  "Sombor",
  "Užice",
  "Požarevac",
  "Pirot",
] as const;
