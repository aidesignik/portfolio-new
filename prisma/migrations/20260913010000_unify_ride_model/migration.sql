-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BlockReason" AS ENUM ('MAINTENANCE', 'DAY_OFF', 'VACATION', 'OTHER');

-- AlterTable: license plate on Vehicle
ALTER TABLE "Vehicle" ADD COLUMN "licensePlate" TEXT;

-- CreateTable: Ride
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "carrierId" TEXT,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "pickupCity" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "destinationCity" TEXT NOT NULL,
    "destinationLocation" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "isRoundTrip" BOOLEAN NOT NULL DEFAULT false,
    "returnAt" TIMESTAMP(3),
    "passengerCount" INTEGER NOT NULL,
    "estimatedDistanceKm" DOUBLE PRECISION,
    "specialRequests" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'RSD',
    "status" "RideStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RideStop
CREATE TABLE "RideStop" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "RideStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Block
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" "BlockReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- Migrate data: every BookingRequest becomes a Ride with the SAME id
-- (preserves external references), enriched with its accepted Booking's
-- carrier/vehicle/driver/price when one exists. OFFERED collapses to
-- PENDING (still unassigned in the new model — there's no separate offer
-- concept any more); EXPIRED collapses to CANCELLED.
INSERT INTO "Ride" (
  "id", "clientId", "carrierId", "vehicleId", "driverId",
  "pickupCity", "pickupLocation", "pickupLat", "pickupLng",
  "destinationCity", "destinationLocation", "destinationLat", "destinationLng",
  "departureAt", "isRoundTrip", "returnAt", "passengerCount",
  "estimatedDistanceKm", "specialRequests",
  "price", "currency", "status", "createdAt", "updatedAt"
)
SELECT
  br."id", br."clientId", b."carrierId", b."vehicleId", b."driverId",
  br."pickupCity", br."pickupLocation", br."pickupLat", br."pickupLng",
  br."destinationCity", br."destinationLocation", br."destinationLat", br."destinationLng",
  br."departureAt", br."isRoundTrip", br."returnAt", br."passengerCount",
  br."estimatedDistanceKm", br."specialRequests",
  b."price", COALESCE(b."currency", 'RSD'),
  CASE
    WHEN b."status" = 'CONFIRMED' THEN 'CONFIRMED'::"RideStatus"
    WHEN b."status" = 'IN_PROGRESS' THEN 'CONFIRMED'::"RideStatus"
    WHEN b."status" = 'COMPLETED' THEN 'COMPLETED'::"RideStatus"
    WHEN b."status" = 'CANCELLED' THEN 'CANCELLED'::"RideStatus"
    WHEN br."status" = 'PENDING' THEN 'PENDING'::"RideStatus"
    WHEN br."status" = 'OFFERED' THEN 'PENDING'::"RideStatus"
    WHEN br."status" = 'CANCELLED' THEN 'CANCELLED'::"RideStatus"
    WHEN br."status" = 'EXPIRED' THEN 'CANCELLED'::"RideStatus"
    ELSE 'PENDING'::"RideStatus"
  END,
  br."createdAt", br."updatedAt"
FROM "BookingRequest" br
LEFT JOIN "Booking" b ON b."requestId" = br."id";

-- Migrate stops (id-space translation: rideId = old requestId)
INSERT INTO "RideStop" ("id", "rideId", "order", "city", "location", "lat", "lng")
SELECT "id", "requestId", "order", "city", "location", "lat", "lng"
FROM "RequestStop";

-- Repoint Document at Ride instead of Booking, preserving existing rows
-- (generated PDFs etc.) rather than recreating them.
ALTER TABLE "Document" ADD COLUMN "rideId" TEXT;
UPDATE "Document" d
SET "rideId" = b."requestId"
FROM "Booking" b
WHERE b."id" = d."bookingId";
ALTER TABLE "Document" ALTER COLUMN "rideId" SET NOT NULL;
ALTER TABLE "Document" DROP CONSTRAINT "Document_bookingId_fkey";
DROP INDEX IF EXISTS "Document_bookingId_type_key";
DROP INDEX IF EXISTS "Document_bookingId_idx";
ALTER TABLE "Document" DROP COLUMN "bookingId";
ALTER TABLE "Document" ADD CONSTRAINT "Document_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Document_rideId_type_key" ON "Document"("rideId", "type");
CREATE INDEX "Document_rideId_idx" ON "Document"("rideId");

-- Drop the old pipeline now that everything has been migrated
DROP TABLE "Booking";
DROP TABLE "Offer";
DROP TABLE "RequestStop";
DROP TABLE "BookingRequest";
DROP TYPE "RequestStatus";
DROP TYPE "OfferStatus";
DROP TYPE "BookingStatus";

-- Foreign keys for the new tables
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RideStop" ADD CONSTRAINT "RideStop_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Ride_clientId_idx" ON "Ride"("clientId");
CREATE INDEX "Ride_carrierId_idx" ON "Ride"("carrierId");
CREATE INDEX "Ride_vehicleId_idx" ON "Ride"("vehicleId");
CREATE INDEX "Ride_driverId_idx" ON "Ride"("driverId");
CREATE INDEX "Ride_status_idx" ON "Ride"("status");
CREATE INDEX "RideStop_rideId_idx" ON "RideStop"("rideId");
CREATE INDEX "Block_carrierId_idx" ON "Block"("carrierId");
CREATE INDEX "Block_vehicleId_idx" ON "Block"("vehicleId");
CREATE INDEX "Block_driverId_idx" ON "Block"("driverId");
