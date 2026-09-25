// Notion-style table sizing: every column gets a fixed, content-appropriate
// width and the table's own width is just the sum of its columns — nothing
// stretches to fill whatever's left in the window. These constants are the
// single source of truth for both a table's grid-template-columns and the
// matching PageHeader title row's max-width, so the "+ Add..." button lines
// up with the table's right edge instead of the window's.

const ROW_GAP_PX = 12; // Tailwind gap-3
const ROW_PADDING_PX = 32; // Tailwind px-4 on both sides

function tableWidth(columns: number[]) {
  return columns.reduce((sum, w) => sum + w, 0) + ROW_GAP_PX * (columns.length - 1) + ROW_PADDING_PX;
}

function gridTemplate(columns: number[]) {
  return columns.map((w) => `${w}px`).join(" ");
}

// vehicle, details, status, documents, assignedDriver, actions
export const FLEET_COLUMNS = [280, 130, 100, 220, 90, 44];
export const FLEET_GRID_TEMPLATE = gridTemplate(FLEET_COLUMNS);
export const FLEET_TABLE_WIDTH = tableWidth(FLEET_COLUMNS);

// driver, licenseNumber, assignedVehicle, documents, actions
export const DRIVERS_COLUMNS = [260, 130, 220, 220, 44];
export const DRIVERS_GRID_TEMPLATE = gridTemplate(DRIVERS_COLUMNS);
export const DRIVERS_TABLE_WIDTH = tableWidth(DRIVERS_COLUMNS);

// route, date & time, passengers, status
export const BOOKINGS_COLUMNS = [280, 210, 100, 110];
export const BOOKINGS_GRID_TEMPLATE = gridTemplate(BOOKINGS_COLUMNS);
export const BOOKINGS_TABLE_WIDTH = tableWidth(BOOKINGS_COLUMNS);

// resource name column + 7 fixed-width day columns
export const CALENDAR_RESOURCE_COLUMN_WIDTH = 208;
export const CALENDAR_DAY_COLUMN_WIDTH = 128;
export const CALENDAR_GRID_TEMPLATE = `${CALENDAR_RESOURCE_COLUMN_WIDTH}px repeat(7, ${CALENDAR_DAY_COLUMN_WIDTH}px)`;
export const CALENDAR_GRID_WIDTH = CALENDAR_RESOURCE_COLUMN_WIDTH + 7 * CALENDAR_DAY_COLUMN_WIDTH;
