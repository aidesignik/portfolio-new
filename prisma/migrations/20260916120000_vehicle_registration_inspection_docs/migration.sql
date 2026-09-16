-- Last registration date, last technical inspection date, and an optional
-- set of attached document files (registration papers, inspection
-- certificate, etc.) per vehicle. All nullable/empty by default — no
-- backfill needed, existing vehicles just show these as unset.
ALTER TABLE "Vehicle"
  ADD COLUMN "lastRegistrationDate" TIMESTAMP(3),
  ADD COLUMN "lastInspectionDate" TIMESTAMP(3),
  ADD COLUMN "documentUrls" TEXT[] NOT NULL DEFAULT '{}';
