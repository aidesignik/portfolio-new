-- CreateIndex
CREATE INDEX "Ride_carrierId_status_departureAt_idx" ON "Ride"("carrierId", "status", "departureAt");

-- CreateIndex
CREATE INDEX "Ride_status_vehicleId_driverId_idx" ON "Ride"("status", "vehicleId", "driverId");
