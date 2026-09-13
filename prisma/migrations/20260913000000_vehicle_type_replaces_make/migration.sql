-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('VAN', 'MINIBUS', 'MIDIBUS', 'COACH');

-- AlterTable: add "type" nullable first so existing rows aren't rejected
ALTER TABLE "Vehicle" ADD COLUMN "type" "VehicleType";

-- Backfill from seat count, since "make" (a free-text brand name) has no
-- reliable mapping to a group-transport size tier.
UPDATE "Vehicle" SET "type" = CASE
  WHEN "seats" <= 9 THEN 'VAN'
  WHEN "seats" <= 19 THEN 'MINIBUS'
  WHEN "seats" <= 35 THEN 'MIDIBUS'
  ELSE 'COACH'
END::"VehicleType";

-- Now that every row has a value, enforce it going forward
ALTER TABLE "Vehicle" ALTER COLUMN "type" SET NOT NULL;

-- Drop the old free-text brand field
ALTER TABLE "Vehicle" DROP COLUMN "make";
