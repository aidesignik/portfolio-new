-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "isRoundTrip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnAt" TIMESTAMP(3);
