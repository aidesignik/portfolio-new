import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateDocument } from "./generate";

const TYPES: DocumentType[] = ["CONFIRMATION", "CONTRACT", "INVOICE"];

// Called after a ride becomes fully assigned (vehicle + driver + price) or
// after any edit to an already-assigned ride's trip details — regenerates
// all three documents so the ride detail sheet never needs a manual
// "Generate" button. A no-op until the ride actually has everything a
// document needs.
export async function regenerateRideDocuments(rideId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { vehicleId: true, driverId: true, price: true },
  });
  if (!ride?.vehicleId || !ride.driverId || ride.price === null) return;
  await Promise.all(TYPES.map((type) => generateDocument(rideId, type)));
}
