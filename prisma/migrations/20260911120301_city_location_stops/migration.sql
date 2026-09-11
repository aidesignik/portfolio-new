/*
  Warnings:

  - You are about to drop the column `destinationAddress` on the `BookingRequest` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddress` on the `BookingRequest` table. All the data in the column will be lost.
  - Added the required column `destinationCity` to the `BookingRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationLocation` to the `BookingRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupCity` to the `BookingRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLocation` to the `BookingRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BookingRequest" DROP COLUMN "destinationAddress",
DROP COLUMN "pickupAddress",
ADD COLUMN     "destinationCity" TEXT NOT NULL,
ADD COLUMN     "destinationLocation" TEXT NOT NULL,
ADD COLUMN     "pickupCity" TEXT NOT NULL,
ADD COLUMN     "pickupLocation" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RequestStop" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "RequestStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestStop_requestId_idx" ON "RequestStop"("requestId");

-- AddForeignKey
ALTER TABLE "RequestStop" ADD CONSTRAINT "RequestStop_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BookingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
