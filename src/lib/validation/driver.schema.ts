import { z } from "zod";
import { DRIVER_COLOR_KEYS, type DriverColorKey } from "@/lib/driver-colors";

// Set by the document-upload endpoint (relative /api/carrier/driver-docs/...
// paths), not typed by the user, so no URL-format check is needed.
const docUrl = z.string().min(1).optional().or(z.literal(""));

export const driverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  isAvailable: z.coerce.boolean().default(true),
  licenseNumber: z.string().optional(),
  vehicleIds: z.array(z.string()).default([]),
  // Omitted on create -> the API assigns the least-used color. Always sent
  // on edit (the picker is always pre-filled with the driver's current
  // color), so a PATCH never needs to "auto-assign".
  avatarColor: z.enum(DRIVER_COLOR_KEYS as [DriverColorKey, ...DriverColorKey[]]).optional(),

  idCardExpiry: z.coerce.date().optional(),
  idCardFrontUrl: docUrl,
  idCardBackUrl: docUrl,

  licenseExpiry: z.coerce.date().optional(),
  licenseFrontUrl: docUrl,
  licenseBackUrl: docUrl,

  cpcExpiry: z.coerce.date().optional(),
  cpcFrontUrl: docUrl,
  cpcBackUrl: docUrl,

  medicalCertExpiry: z.coerce.date().optional(),
  medicalCertFrontUrl: docUrl,
  medicalCertBackUrl: docUrl,
});
