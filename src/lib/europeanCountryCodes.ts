// Standard UN M49 "Europe" grouping, plus Kosovo (XK, not an ISO code but
// used by this app's city dataset) and Russia. Transcontinental Turkey is
// left out since it's classified as Western Asia. Shared by the city-
// suggestion dropdown (citySearch.ts, which scopes its dataset to these
// countries) and by geocoding.ts (which scopes live Nominatim lookups to
// the same countries), so both stay in sync.
export const EUROPEAN_COUNTRY_CODES = [
  "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE",
  "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU",
  "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
  "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ",
  "SK", "SM", "UA", "VA", "XK",
] as const;
