-- A round trip's return leg can now have its own pickup, destination and
-- stops instead of always assuming the exact reverse of the outbound leg.
-- All nullable/defaulted — a round trip with nothing set here just falls
-- back to the outbound leg reversed, computed at read time.
CREATE TYPE "RideLeg" AS ENUM ('OUTBOUND', 'RETURN');

ALTER TABLE "Ride"
  ADD COLUMN "returnPickupCity" TEXT,
  ADD COLUMN "returnPickupLocation" TEXT,
  ADD COLUMN "returnPickupLat" DOUBLE PRECISION,
  ADD COLUMN "returnPickupLng" DOUBLE PRECISION,
  ADD COLUMN "returnDestinationCity" TEXT,
  ADD COLUMN "returnDestinationLocation" TEXT,
  ADD COLUMN "returnDestinationLat" DOUBLE PRECISION,
  ADD COLUMN "returnDestinationLng" DOUBLE PRECISION;

ALTER TABLE "RideStop" ADD COLUMN "leg" "RideLeg" NOT NULL DEFAULT 'OUTBOUND';
