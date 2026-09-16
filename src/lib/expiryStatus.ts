// Shared "expiring soon" logic for vehicle registration/inspection and
// driver documents — used by the carrier dashboard banner and the badges
// on the fleet/driver list pages, so the two stay in sync.

// Driver documents (ID card, license, CPC, medical certificate) carry a
// real expiry date the carrier enters. Vehicle registration/technical
// inspection only store the *last* renewal date — v1 assumes a fixed
// 12-month validity from that date rather than asking the carrier for a
// separate expiry (easy to change later if the real interval differs).
export const VEHICLE_DOCUMENT_VALIDITY_MONTHS = 12;
export const EXPIRY_WARNING_DAYS = 30;

export type ExpiryStatus = "expired" | "expiringSoon";

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function vehicleRegistrationExpiry(lastRegistrationDate: Date | null): Date | null {
  return lastRegistrationDate ? addMonths(lastRegistrationDate, VEHICLE_DOCUMENT_VALIDITY_MONTHS) : null;
}

export function vehicleInspectionExpiry(lastInspectionDate: Date | null): Date | null {
  return lastInspectionDate ? addMonths(lastInspectionDate, VEHICLE_DOCUMENT_VALIDITY_MONTHS) : null;
}

export function expiryStatus(expiryDate: Date | null, now: Date = new Date()): ExpiryStatus | null {
  if (!expiryDate) return null;
  if (expiryDate < now) return "expired";
  const warnBy = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  return expiryDate <= warnBy ? "expiringSoon" : null;
}

// The more urgent of two statuses — used to pick a single badge tone when
// an entity has more than one expiring document.
export function worseStatus(a: ExpiryStatus | null, b: ExpiryStatus | null): ExpiryStatus | null {
  if (a === "expired" || b === "expired") return "expired";
  return a ?? b;
}

export type ExpiryDocKind = "registration" | "inspection" | "idCard" | "license" | "cpc" | "medicalCert";

export interface ExpiringItem {
  entityType: "vehicle" | "driver";
  entityId: string;
  entityLabel: string;
  docKind: ExpiryDocKind;
  status: ExpiryStatus;
  expiryDate: Date;
}

export function vehicleExpiringItems(
  vehicle: { id: string; lastRegistrationDate: Date | null; lastInspectionDate: Date | null },
  label: string,
  now: Date = new Date(),
): ExpiringItem[] {
  const items: ExpiringItem[] = [];
  const registrationExpiry = vehicleRegistrationExpiry(vehicle.lastRegistrationDate);
  const registrationStatus = expiryStatus(registrationExpiry, now);
  if (registrationStatus && registrationExpiry) {
    items.push({
      entityType: "vehicle",
      entityId: vehicle.id,
      entityLabel: label,
      docKind: "registration",
      status: registrationStatus,
      expiryDate: registrationExpiry,
    });
  }
  const inspectionExpiry = vehicleInspectionExpiry(vehicle.lastInspectionDate);
  const inspectionStatus = expiryStatus(inspectionExpiry, now);
  if (inspectionStatus && inspectionExpiry) {
    items.push({
      entityType: "vehicle",
      entityId: vehicle.id,
      entityLabel: label,
      docKind: "inspection",
      status: inspectionStatus,
      expiryDate: inspectionExpiry,
    });
  }
  return items;
}

export function driverExpiringItems(
  driver: {
    id: string;
    idCardExpiry: Date | null;
    licenseExpiry: Date | null;
    cpcExpiry: Date | null;
    medicalCertExpiry: Date | null;
  },
  label: string,
  now: Date = new Date(),
): ExpiringItem[] {
  const docs: { kind: ExpiryDocKind; expiry: Date | null }[] = [
    { kind: "idCard", expiry: driver.idCardExpiry },
    { kind: "license", expiry: driver.licenseExpiry },
    { kind: "cpc", expiry: driver.cpcExpiry },
    { kind: "medicalCert", expiry: driver.medicalCertExpiry },
  ];
  const items: ExpiringItem[] = [];
  for (const doc of docs) {
    const status = expiryStatus(doc.expiry, now);
    if (status && doc.expiry) {
      items.push({
        entityType: "driver",
        entityId: driver.id,
        entityLabel: label,
        docKind: doc.kind,
        status,
        expiryDate: doc.expiry,
      });
    }
  }
  return items;
}

// The single most urgent status across a list of items — for a compact
// badge on a fleet/driver list row that can only show one.
export function worstItemStatus(items: ExpiringItem[]): ExpiryStatus | null {
  return items.reduce<ExpiryStatus | null>((worst, item) => worseStatus(worst, item.status), null);
}

// Expired first, then soonest expiry — the most urgent items lead the list.
export function sortExpiringItems(items: ExpiringItem[]): ExpiringItem[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === "expired" ? -1 : 1;
    return a.expiryDate.getTime() - b.expiryDate.getTime();
  });
}
