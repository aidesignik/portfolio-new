import type { CityLocation } from "@/lib/location";

export interface RideOutboundLeg {
  pickupCity: string;
  pickupLocation: string;
  destinationCity: string;
  destinationLocation: string;
  stops: CityLocation[];
}

export interface RideReturnLegOverride {
  returnPickupCity?: string;
  returnPickupLocation?: string;
  returnDestinationCity?: string;
  returnDestinationLocation?: string;
  returnStops?: CityLocation[];
}

// A round trip's return leg defaults to starting from the outbound
// destination and ending back at the outbound pickup (the endpoints
// swapped) — but its stops are NOT assumed to mirror the outbound leg's,
// since a real return route often skips stops made on the way out (or adds
// different ones). Stops on the way back only ever come from what was
// explicitly added for the return leg.
export function resolveReturnLeg(outbound: RideOutboundLeg, override: RideReturnLegOverride) {
  return {
    pickupCity: override.returnPickupCity ?? outbound.destinationCity,
    pickupLocation: override.returnPickupLocation ?? outbound.destinationLocation,
    destinationCity: override.returnDestinationCity ?? outbound.pickupCity,
    destinationLocation: override.returnDestinationLocation ?? outbound.pickupLocation,
    stops: override.returnStops ?? [],
  };
}

export interface RideStopsInput {
  isRoundTrip: boolean;
  stops: CityLocation[];
  returnStops: CityLocation[];
}

// Builds the nested `stops.create` array for a ride: the outbound leg,
// plus a RETURN-tagged leg only when the carrier actually set a custom
// return route (otherwise nothing is stored — resolveReturnLeg() derives
// the default reverse at read time instead of duplicating it into the DB).
export function buildStopsCreate({ isRoundTrip, stops, returnStops }: RideStopsInput) {
  const outbound = stops.map((stop, index) => ({ ...stop, order: index, leg: "OUTBOUND" as const }));
  const returnLeg =
    isRoundTrip && returnStops.length > 0
      ? returnStops.map((stop, index) => ({ ...stop, order: index, leg: "RETURN" as const }))
      : [];
  return [...outbound, ...returnLeg];
}

export interface RideReturnScalarsInput extends RideReturnLegOverride {
  isRoundTrip: boolean;
}

// The Ride.returnPickup*/returnDestination* override columns — explicit
// null (not undefined) for a one-way trip or a round trip that didn't
// customize the return route, so an update that un-customizes it actually
// clears a previously-set override instead of leaving it stale.
export function returnLegScalars(data: RideReturnScalarsInput) {
  return {
    returnPickupCity: data.isRoundTrip ? (data.returnPickupCity ?? null) : null,
    returnPickupLocation: data.isRoundTrip ? (data.returnPickupLocation ?? null) : null,
    returnDestinationCity: data.isRoundTrip ? (data.returnDestinationCity ?? null) : null,
    returnDestinationLocation: data.isRoundTrip ? (data.returnDestinationLocation ?? null) : null,
  };
}
