// Serbian vehicle registration plate codes, for the compact calendar card's
// city-code route line ("BG ⇆ NS"). Deliberately not exhaustive — any city
// not listed here falls back to its own first two letters uppercased, so a
// missing entry degrades gracefully instead of needing constant upkeep.
const CITY_CODES: Record<string, string> = {
  Beograd: "BG",
  "Novi Sad": "NS",
  Subotica: "SU",
  Zrenjanin: "ZR",
  Niš: "NI",
  Kraljevo: "KV",
  Čačak: "ČA",
  Leskovac: "LE",
  Šabac: "ŠA",
  Pančevo: "PA",
  Smederevo: "SD",
  Valjevo: "VA",
  Užice: "UE",
  Vranje: "VR",
  Kikinda: "KI",
  Sombor: "SO",
  Zaječar: "ZA",
  Požarevac: "PO",
  Jagodina: "JA",
  Loznica: "LO",
  Pirot: "PI",
  Vršac: "VS",
  "Sremska Mitrovica": "SM",
  "Novi Pazar": "NP",
  Bor: "BO",
};

const CITY_CODE_LOOKUP = new Map(
  Object.entries(CITY_CODES).map(([city, code]) => [city.trim().toLowerCase(), code]),
);

export function cityCode(cityName: string): string {
  const known = CITY_CODE_LOOKUP.get(cityName.trim().toLowerCase());
  if (known) return known;
  const letters = cityName
    .trim()
    .replace(/[^\p{L}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
  return letters || "??";
}
