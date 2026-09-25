// Notion-style table sizing: every column gets a fixed, content-appropriate
// width — nothing stretches to fill whatever's left in the window. These
// constants are the single source of truth for both a table's
// grid-template-columns and the matching PageHeader title row's max-width,
// so the "+ Add..." button lines up with the table's right edge.
//
// Fleet, Drivers and Bookings are further scaled so their total width
// matches CALENDAR_GRID_WIDTH exactly (columns grown proportionally, same
// relative ratios as the original sizing) — so every one of these screens
// is the same width and the "+ Add..."/"+ New Ride" button sits at the
// same horizontal position no matter which page you're on.

const ROW_GAP_PX = 12; // Tailwind gap-3
const ROW_PADDING_PX = 32; // Tailwind px-4 on both sides

function tableWidth(columns: number[]) {
  return columns.reduce((sum, w) => sum + w, 0) + ROW_GAP_PX * (columns.length - 1) + ROW_PADDING_PX;
}

function gridTemplate(columns: number[]) {
  return columns.map((w) => `${w}px`).join(" ");
}

// Scales columns proportionally so the table's total width matches
// `target`, rounding every column but the last and letting the last one
// absorb the rounding remainder so the total lands on `target` exactly.
function scaleColumnsTo(target: number, columns: number[]) {
  const contentTarget = target - ROW_GAP_PX * (columns.length - 1) - ROW_PADDING_PX;
  const scale = contentTarget / columns.reduce((sum, w) => sum + w, 0);
  const scaled = columns.map((w) => Math.round(w * scale));
  const roundedSum = scaled.slice(0, -1).reduce((sum, w) => sum + w, 0);
  scaled[scaled.length - 1] = contentTarget - roundedSum;
  return scaled;
}

// resource name column + 7 fixed-width day columns
export const CALENDAR_RESOURCE_COLUMN_WIDTH = 208;
export const CALENDAR_DAY_COLUMN_WIDTH = 128;
export const CALENDAR_GRID_TEMPLATE = `${CALENDAR_RESOURCE_COLUMN_WIDTH}px repeat(7, ${CALENDAR_DAY_COLUMN_WIDTH}px)`;
export const CALENDAR_GRID_WIDTH = CALENDAR_RESOURCE_COLUMN_WIDTH + 7 * CALENDAR_DAY_COLUMN_WIDTH;

// vehicle, details, status, documents, assignedDriver, actions
export const FLEET_COLUMNS = scaleColumnsTo(CALENDAR_GRID_WIDTH, [280, 130, 100, 220, 90, 44]);
export const FLEET_GRID_TEMPLATE = gridTemplate(FLEET_COLUMNS);
export const FLEET_TABLE_WIDTH = tableWidth(FLEET_COLUMNS);

// driver, licenseNumber, assignedVehicle, documents, actions
export const DRIVERS_COLUMNS = scaleColumnsTo(CALENDAR_GRID_WIDTH, [260, 130, 220, 220, 44]);
export const DRIVERS_GRID_TEMPLATE = gridTemplate(DRIVERS_COLUMNS);
export const DRIVERS_TABLE_WIDTH = tableWidth(DRIVERS_COLUMNS);

// route, date & time, passengers, status
export const BOOKINGS_COLUMNS = scaleColumnsTo(CALENDAR_GRID_WIDTH, [280, 210, 100, 110]);
export const BOOKINGS_GRID_TEMPLATE = gridTemplate(BOOKINGS_COLUMNS);
export const BOOKINGS_TABLE_WIDTH = tableWidth(BOOKINGS_COLUMNS);
