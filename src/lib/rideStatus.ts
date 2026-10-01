import type { RideStatus } from "@/components/calendar/types";

const AVERAGE_TRIP_DURATION_MS = 4 * 60 * 60 * 1000;

export interface RideStatusInput {
  status: RideStatus;
  departureAt: string;
  returnAt: string | null;
}

// A confirmed ride whose trip window has already passed reads as completed
// everywhere its status is shown, even though nothing ever writes
// COMPLETED to the database — carriers shouldn't have to manually close
// out every ride. A ride read as completed here is also no longer
// cancellable (see the cancel route and RideDetailDrawer) — a trip that
// already happened isn't something to cancel.
export function displayRideStatus(ride: RideStatusInput): RideStatus {
  if (ride.status !== "CONFIRMED") return ride.status;
  const departure = new Date(ride.departureAt);
  const end = ride.returnAt ? new Date(ride.returnAt) : new Date(departure.getTime() + AVERAGE_TRIP_DURATION_MS);
  return end.getTime() < Date.now() ? "COMPLETED" : "CONFIRMED";
}
