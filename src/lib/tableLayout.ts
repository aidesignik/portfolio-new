// Grid templates shared by the calendar and the Fleet/Drivers/Bookings
// tables. Per the Atlas Build Review spec, the calendar/table container now
// fills the page's 1280px-capped wrapper (PageContent) rather than
// shrink-wrapping to a fixed column sum — so each identity column (resource
// name, vehicle, driver, route) flexes with the remaining width and only
// the metadata columns (status, documents, pax, actions…) stay fixed-width.

export const CALENDAR_RESOURCE_COLUMN_WIDTH = 220;
// Day columns flex to fill available width but never shrink below 120px —
// without a floor they'd just keep compressing on a narrow viewport instead
// of the grid ever overflowing, which would mean the horizontal scroll (and
// the sticky resource column that depends on it) never actually kicks in.
export const CALENDAR_DAY_COLUMN_MIN_WIDTH = 120;
export const CALENDAR_GRID_TEMPLATE = `${CALENDAR_RESOURCE_COLUMN_WIDTH}px repeat(7, minmax(${CALENDAR_DAY_COLUMN_MIN_WIDTH}px, 1fr))`;

// vehicle, year+seats, documents, driver, kebab
export const FLEET_GRID_TEMPLATE = "minmax(0,2fr) 190px minmax(0,1.5fr) minmax(0,1.3fr) 36px";

// driver, licenseNumber, vehicle, documents, kebab
export const DRIVERS_GRID_TEMPLATE = "minmax(0,1.6fr) 170px minmax(0,1.5fr) minmax(0,1.4fr) 36px";

// route, time, vehicle, driver, passengers, status, kebab
export const BOOKINGS_GRID_TEMPLATE = "minmax(0,2fr) 160px minmax(0,1.1fr) minmax(0,1fr) 96px 132px 36px";
