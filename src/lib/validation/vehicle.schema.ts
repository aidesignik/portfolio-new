import { z } from "zod";

export const vehicleAmenities = ["AC", "WIFI", "USB", "TOILET"] as const;
export const vehicleStatuses = ["ACTIVE", "INACTIVE"] as const;
export const vehicleTypes = ["VAN", "MINIBUS", "MIDIBUS", "COACH", "DOUBLE_DECKER"] as const;

export const vehicleSchema = z.object({
  type: z.enum(vehicleTypes),
  model: z.string().min(1),
  licensePlate: z.string().min(1).optional(),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  seats: z.coerce.number().int().min(1).max(200),
  amenities: z.array(z.enum(vehicleAmenities)).default([]),
  otherAmenities: z.string().max(500).optional(),
  status: z.enum(vehicleStatuses).default("ACTIVE"),
  // Set by the photo-upload endpoint (relative /api/carrier/vehicle-photos/...
  // paths), not typed by the user, so no URL-format check is needed here.
  photos: z.array(z.string().min(1)).max(10).default([]),
  lastRegistrationDate: z.coerce.date().optional(),
  lastInspectionDate: z.coerce.date().optional(),
  // Set by the document-upload endpoint (relative /api/carrier/vehicle-docs/...
  // paths), not typed by the user, so no URL-format check is needed here.
  documentUrls: z.array(z.string().min(1)).max(10).default([]),
});
