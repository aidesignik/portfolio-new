// Grid templates shared by the calendar and the Fleet/Drivers/Bookings
// tables. Per the Atlas Build Review spec, the calendar/table container now
// fills the page's 1280px-capped wrapper (PageContent) rather than
// shrink-wrapping to a fixed column sum — so each identity column (resource
// name, vehicle, driver, route) flexes with the remaining width and only
// the metadata columns (status, documents, pax, actions…) stay fixed-width.

export const CALENDAR_RESOURCE_COLUMN_WIDTH = 220;
export const CALENDAR_GRID_TEMPLATE = `${CALENDAR_RESOURCE_COLUMN_WIDTH}px repeat(7, minmax(0, 1fr))`;

// vehicle, details, status, documents, assignedDriver, actions
export const FLEET_GRID_TEMPLATE = "minmax(0,1fr) 140px 110px 220px 100px 44px";

// driver, licenseNumber, assignedVehicle, documents, actions
export const DRIVERS_GRID_TEMPLATE = "minmax(0,1fr) 140px 220px 220px 44px";

// route, date & time, passengers, status
export const BOOKINGS_GRID_TEMPLATE = "minmax(0,1fr) 180px 100px 140px";
