-- Add an optional postal code to Carrier, alongside the existing city and
-- street address. No country column: the app is Serbia-only for now, so
-- that's assumed rather than stored.
ALTER TABLE "Carrier" ADD COLUMN "postalCode" TEXT;
