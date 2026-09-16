"use client";

import { useTranslations } from "next-intl";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { resolveReturnLeg } from "@/lib/rideReturnLeg";
import type { CityLocation } from "@/lib/location";

export interface ReturnTripValues {
  differentReturnRoute: boolean;
  returnPickupCity: string;
  returnPickupLocation: string;
  returnStops: CityLocation[];
  returnDestinationCity: string;
  returnDestinationLocation: string;
}

export const EMPTY_RETURN_TRIP: ReturnTripValues = {
  differentReturnRoute: false,
  returnPickupCity: "",
  returnPickupLocation: "",
  returnStops: [],
  returnDestinationCity: "",
  returnDestinationLocation: "",
};

// Shared shape for the return-leg fields in a ride submit payload — leaves
// them undefined/empty (server defaults to the outbound leg reversed)
// unless the carrier picked a different route for the way back.
export function returnTripPayload(isRoundTrip: boolean, returnTrip: ReturnTripValues) {
  if (!isRoundTrip || !returnTrip.differentReturnRoute) {
    return {
      returnPickupCity: undefined,
      returnPickupLocation: undefined,
      returnStops: [] as CityLocation[],
      returnDestinationCity: undefined,
      returnDestinationLocation: undefined,
    };
  }
  return {
    returnPickupCity: returnTrip.returnPickupCity,
    returnPickupLocation: returnTrip.returnPickupLocation,
    returnStops: returnTrip.returnStops,
    returnDestinationCity: returnTrip.returnDestinationCity,
    returnDestinationLocation: returnTrip.returnDestinationLocation,
  };
}

// Shown under the round-trip checkbox in every ride form (client request,
// carrier quick-create, carrier full booking, ride edit). By default the
// return leg is assumed to be the outbound leg reversed; checking "Different
// route for the way back" reveals its own pickup/stops/destination, seeded
// from that reverse so there's something sensible to edit from.
export function ReturnTripFields({
  value,
  onChange,
  outboundPickupCity,
  outboundPickupLocation,
  outboundDestinationCity,
  outboundDestinationLocation,
  outboundStops,
}: {
  value: ReturnTripValues;
  onChange: (value: ReturnTripValues) => void;
  outboundPickupCity: string;
  outboundPickupLocation: string;
  outboundDestinationCity: string;
  outboundDestinationLocation: string;
  outboundStops: CityLocation[];
}) {
  const t = useTranslations("client.requestForm");

  function toggleDifferentRoute(checked: boolean) {
    if (checked && !value.returnPickupCity && !value.returnDestinationCity) {
      // Seed the fields with the outbound leg reversed (the same default
      // the server falls back to), so there's something sensible to edit
      // from rather than a blank form.
      const seeded = resolveReturnLeg(
        {
          pickupCity: outboundPickupCity,
          pickupLocation: outboundPickupLocation,
          destinationCity: outboundDestinationCity,
          destinationLocation: outboundDestinationLocation,
          stops: outboundStops,
        },
        {},
      );
      onChange({
        ...value,
        differentReturnRoute: true,
        returnPickupCity: seeded.pickupCity,
        returnPickupLocation: seeded.pickupLocation,
        returnStops: seeded.stops,
        returnDestinationCity: seeded.destinationCity,
        returnDestinationLocation: seeded.destinationLocation,
      });
      return;
    }
    onChange({ ...value, differentReturnRoute: checked });
  }

  function addStop() {
    if (value.returnStops.length >= 5) return;
    onChange({ ...value, returnStops: [...value.returnStops, { city: "", location: "" }] });
  }
  function removeStop(index: number) {
    onChange({ ...value, returnStops: value.returnStops.filter((_, i) => i !== index) });
  }
  function updateStop(index: number, patch: Partial<CityLocation>) {
    onChange({
      ...value,
      returnStops: value.returnStops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.differentReturnRoute}
          onChange={(e) => toggleDifferentRoute(e.target.checked)}
        />
        {t("differentReturnRoute")}
      </label>

      {value.differentReturnRoute ? (
        <div className="space-y-3 rounded-md border border-zinc-200 p-3">
          <p className="text-xs text-zinc-500">{t("differentReturnRouteHint")}</p>

          <CityLocationFields
            cityLabel={t("returnPickupCity")}
            locationLabel={t("returnPickupLocation")}
            city={value.returnPickupCity}
            location={value.returnPickupLocation}
            onCityChange={(v) => onChange({ ...value, returnPickupCity: v })}
            onLocationChange={(v) => onChange({ ...value, returnPickupLocation: v })}
          />

          {value.returnStops.map((stop, index) => (
            <div key={index} className="space-y-2 rounded-md border border-dashed border-zinc-300 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {t("stop")} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t("removeStop")}
                </button>
              </div>
              <CityLocationFields
                cityLabel={t("pickupCity")}
                locationLabel={t("pickupLocation")}
                city={stop.city}
                location={stop.location}
                onCityChange={(v) => updateStop(index, { city: v })}
                onLocationChange={(v) => updateStop(index, { location: v })}
              />
            </div>
          ))}
          {value.returnStops.length < 5 ? (
            <button type="button" onClick={addStop} className="text-sm font-medium text-zinc-700 underline">
              + {t("addStop")}
            </button>
          ) : null}

          <CityLocationFields
            cityLabel={t("returnDestinationCity")}
            locationLabel={t("returnDestinationLocation")}
            city={value.returnDestinationCity}
            location={value.returnDestinationLocation}
            onCityChange={(v) => onChange({ ...value, returnDestinationCity: v })}
            onLocationChange={(v) => onChange({ ...value, returnDestinationLocation: v })}
          />
        </div>
      ) : null}
    </div>
  );
}
