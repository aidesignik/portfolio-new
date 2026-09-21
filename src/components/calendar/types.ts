export type RideStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface CalendarRide {
  id: string;
  clientId: string;
  client: { name: string | null; phone: string | null };
  carrierId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  pickupCity: string;
  pickupLocation: string;
  destinationCity: string;
  destinationLocation: string;
  stops: { city: string; location: string }[];
  departureAt: string;
  returnAt: string | null;
  isRoundTrip: boolean;
  returnPickupCity: string | null;
  returnPickupLocation: string | null;
  returnStops: { city: string; location: string }[];
  returnDestinationCity: string | null;
  returnDestinationLocation: string | null;
  passengerCount: number;
  specialRequests: string | null;
  estimatedDistanceKm: number | null;
  price: string | null;
  currency: string;
  status: RideStatus;
}

export interface CalendarBlock {
  id: string;
  vehicleId: string | null;
  driverId: string | null;
  startAt: string;
  endAt: string;
  reason: "MAINTENANCE" | "DAY_OFF" | "VACATION" | "OTHER";
  note: string | null;
}

export interface CalendarVehicle {
  id: string;
  type: string;
  model: string;
  licensePlate: string | null;
  seats: number;
  status: string;
  photos: string[];
}

export interface CalendarDriver {
  id: string;
  name: string;
  isAvailable: boolean;
}

export interface CalendarData {
  weekStart: string;
  weekEnd: string;
  vehicles: CalendarVehicle[];
  drivers: CalendarDriver[];
  rides: CalendarRide[];
  blocks: CalendarBlock[];
  unassigned: CalendarRide[];
}

export type ResourceGrouping = "vehicle" | "driver";
