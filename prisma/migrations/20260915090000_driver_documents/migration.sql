-- Driver documents: ID card, driver's license, CPC and medical certificate,
-- each with an expiry date and front/back photo. All nullable — no
-- backfill needed, existing drivers just show these as unset.
ALTER TABLE "Driver"
  ADD COLUMN "idCardExpiry" TIMESTAMP(3),
  ADD COLUMN "idCardFrontUrl" TEXT,
  ADD COLUMN "idCardBackUrl" TEXT,
  ADD COLUMN "licenseExpiry" TIMESTAMP(3),
  ADD COLUMN "licenseFrontUrl" TEXT,
  ADD COLUMN "licenseBackUrl" TEXT,
  ADD COLUMN "cpcExpiry" TIMESTAMP(3),
  ADD COLUMN "cpcFrontUrl" TEXT,
  ADD COLUMN "cpcBackUrl" TEXT,
  ADD COLUMN "medicalCertExpiry" TIMESTAMP(3),
  ADD COLUMN "medicalCertFrontUrl" TEXT,
  ADD COLUMN "medicalCertBackUrl" TEXT;
