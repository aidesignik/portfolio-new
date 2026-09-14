-- Add optional company-profile fields to Carrier: registration number
-- ("Matični broj"), legal representative ("odgovorno lice"), full street
-- address, and an optional logo URL. All nullable — no backfill needed,
-- existing carriers just show these as unset until they fill them in.
ALTER TABLE "Carrier"
  ADD COLUMN "registrationNumber" TEXT,
  ADD COLUMN "legalRepresentative" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "logoUrl" TEXT;
