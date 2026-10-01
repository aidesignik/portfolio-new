import cities from "cities.json";

export interface CitySuggestion {
  /** What to show in the dropdown and store as the city value if picked. */
  display: string;
}

interface RawCity {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

// A few GeoNames records carry an English exonym as their primary name
// instead of the local Latin-script spelling — e.g. Belgrade's record is
// literally named "Belgrade", not "Beograd". Patched here rather than
// touching the dataset.
const NAME_OVERRIDES: Record<string, string> = {
  "RS:Belgrade": "Beograd",
};

// cities.json has no population figures to rank by, so a query like "be"
// or "nov" would otherwise surface minor villages ahead of Beograd or
// Novi Sad on pure alphabetical order (e.g. "Bečej" < "Beograd"). This
// gives Serbia's major cities, largest first, a fixed head-of-queue spot
// among same-tier RS matches — everything else still falls back to
// alphabetical.
const MAJOR_RS_CITIES = [
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
];
const majorRsRank = new Map(MAJOR_RS_CITIES.map((name, i) => [name, i]));

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function searchKey(value: string): string {
  return stripDiacritics(value).toLowerCase();
}

interface IndexedCity {
  name: string;
  country: string;
  key: string;
}

// Built once per server process from the bundled ~171k-city dataset, keyed
// by a diacritic-stripped lowercase form so a query like "cacak" (easier to
// type without a Serbian keyboard layout) still finds "Čačak".
let index: IndexedCity[] | null = null;

function getIndex(): IndexedCity[] {
  if (!index) {
    index = (cities as RawCity[]).map((c) => {
      const name = NAME_OVERRIDES[`${c.country}:${c.name}`] ?? c.name;
      return { name, country: c.country, key: searchKey(name) };
    });
  }
  return index;
}

const MAX_RESULTS = 8;

/**
 * Instant, local city/town search backing the city-field suggestion
 * dropdown. Replaces a live Nominatim lookup — too slow for a
 * keystroke-driven dropdown (network round-trip plus Nominatim's ~1
 * req/sec rate limit), and prone to returning Cyrillic names for Serbian
 * places since that's Serbia's official script in OSM data — with an
 * in-memory scan over a bundled worldwide dataset that's confirmed to use
 * Latin spellings for Serbian settlements. Domestic (Serbian) results are
 * shown bare ("Beograd"); others get the country appended
 * ("Paris, France") for disambiguation.
 */
export function searchCities(query: string): CitySuggestion[] {
  const q = searchKey(query.trim());
  if (q.length < 2) return [];

  const exact: IndexedCity[] = [];
  const starts: IndexedCity[] = [];
  const contains: IndexedCity[] = [];
  for (const city of getIndex()) {
    if (city.key === q) exact.push(city);
    else if (city.key.startsWith(q)) starts.push(city);
    else if (city.key.includes(q)) contains.push(city);
  }
  // No population data to rank by, so for a short query that matches
  // places worldwide (e.g. "be"), favor this app's mostly-Serbian user
  // base over plain alphabetical order — otherwise an unrelated village
  // that happens to sort earlier can bump Beograd off an 8-result list.
  const byRelevance = (a: IndexedCity, b: IndexedCity) => {
    if (a.country === "RS" && b.country !== "RS") return -1;
    if (a.country !== "RS" && b.country === "RS") return 1;
    const rankA = majorRsRank.get(a.name) ?? Infinity;
    const rankB = majorRsRank.get(b.name) ?? Infinity;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  };
  starts.sort(byRelevance);
  contains.sort(byRelevance);

  const seen = new Set<string>();
  const suggestions: CitySuggestion[] = [];
  for (const city of [...exact, ...starts, ...contains]) {
    const display =
      city.country === "RS" ? city.name : `${city.name}, ${regionNames.of(city.country) ?? city.country}`;
    if (seen.has(display)) continue;
    seen.add(display);
    suggestions.push({ display });
    if (suggestions.length >= MAX_RESULTS) break;
  }
  return suggestions;
}
