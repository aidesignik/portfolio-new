-- Vehicle form updates:
-- 1. New vehicle type: double-decker bus.
-- 2. Year becomes optional.
-- 3. Free-text "other amenities" alongside the fixed amenity checkboxes.
ALTER TYPE "VehicleType" ADD VALUE 'DOUBLE_DECKER';

ALTER TABLE "Vehicle" ALTER COLUMN "year" DROP NOT NULL;

ALTER TABLE "Vehicle" ADD COLUMN "otherAmenities" TEXT;
