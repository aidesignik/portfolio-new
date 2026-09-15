import { z } from "zod";

// Set by the document-upload endpoint (relative /api/carrier/driver-docs/...
// paths), not typed by the user, so no URL-format check is needed.
const docUrl = z.string().min(1).optional().or(z.literal(""));

export const driverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  isAvailable: z.coerce.boolean().default(true),
  vehicleIds: z.array(z.string()).default([]),

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
