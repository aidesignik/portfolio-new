// Per-document status chips for the fleet/driver tables — one chip per
// document type (never collapsed into a single badge), covering all three
// states: valid, expiring soon, and expired. Built on top of the same
// addMonths/expiryStatus logic that already powers the dashboard's
// "expiring soon" banner, so the thresholds stay in sync.
import { addMonths, expiryStatus, VEHICLE_DOCUMENT_VALIDITY_MONTHS, type ExpiryDocKind } from "@/lib/expiryStatus";

export type ChipStatus = "valid" | "expiringSoon" | "expired";

export interface DocumentChipData {
  docKind: ExpiryDocKind;
  status: ChipStatus;
  expiryDate: Date;
  daysLeft: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function buildChip(docKind: ExpiryDocKind, expiryDate: Date | null, now: Date): DocumentChipData | null {
  if (!expiryDate) return null;
  const urgency = expiryStatus(expiryDate, now);
  const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / DAY_MS));
  return { docKind, status: urgency ?? "valid", expiryDate, daysLeft };
}

export function vehicleDocumentChips(
  vehicle: { lastRegistrationDate: Date | null; lastInspectionDate: Date | null },
  now: Date = new Date(),
): DocumentChipData[] {
  return [
    buildChip(
      "registration",
      vehicle.lastRegistrationDate ? addMonths(vehicle.lastRegistrationDate, VEHICLE_DOCUMENT_VALIDITY_MONTHS) : null,
      now,
    ),
    buildChip(
      "inspection",
      vehicle.lastInspectionDate ? addMonths(vehicle.lastInspectionDate, VEHICLE_DOCUMENT_VALIDITY_MONTHS) : null,
      now,
    ),
  ].filter((c): c is DocumentChipData => c !== null);
}

export function driverDocumentChips(
  driver: {
    idCardExpiry: Date | null;
    licenseExpiry: Date | null;
    cpcExpiry: Date | null;
    medicalCertExpiry: Date | null;
  },
  now: Date = new Date(),
): DocumentChipData[] {
  return [
    buildChip("idCard", driver.idCardExpiry, now),
    buildChip("license", driver.licenseExpiry, now),
    buildChip("cpc", driver.cpcExpiry, now),
    buildChip("medicalCert", driver.medicalCertExpiry, now),
  ].filter((c): c is DocumentChipData => c !== null);
}
