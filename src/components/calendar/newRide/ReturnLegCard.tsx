"use client";

import { useState, type Ref } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, RotateCcw, X } from "lucide-react";
import { CityCombobox } from "@/components/forms/CityCombobox";
import { Input } from "@/components/ui/Input";
import type { DatePickerHandle } from "@/components/ui/DatePicker";
import type { ReturnTripValues } from "@/components/forms/ReturnTripFields";
import { resolveReturnLeg } from "@/lib/rideReturnLeg";
import type { CityLocation } from "@/lib/location";
import { LegCard, DateTimeRow } from "./RouteLegCard";
import { RouteTimeline } from "./RouteTimeline";
import { FilledMarker, RingMarker, Connector } from "./timelineMarkers";
import { SHEET_INPUT_CLASS, SHEET_TEXT_BUTTON_CLASS } from "./sheetFieldClasses";

type ReturnMode = "mirror" | "stops" | "custom";

function deriveMode(value: ReturnTripValues): ReturnMode {
  if (value.differentReturnRoute) return "custom";
  if (value.returnStops.length > 0) return "stops";
  return "mirror";
}

export function ReturnLegCard({
  value,
  onChange,
  outboundPickupCity,
  outboundPickupLocation,
  outboundDestinationCity,
  outboundDestinationLocation,
  outboundStops,
  departureAt,
  returnAt,
  onReturnAtChange,
  dateRef,
  kmText,
  locationPlaceholder,
  datePlaceholder,
  timePlaceholder,
  returnDateError,
}: {
  value: ReturnTripValues;
  onChange: (value: ReturnTripValues) => void;
  outboundPickupCity: string;
  outboundPickupLocation: string;
  outboundDestinationCity: string;
  outboundDestinationLocation: string;
  outboundStops: CityLocation[];
  departureAt: string;
  returnAt: string;
  onReturnAtChange: (value: string) => void;
  dateRef?: Ref<DatePickerHandle>;
  kmText: string;
  locationPlaceholder: string;
  datePlaceholder: string;
  timePlaceholder: string;
  returnDateError?: string;
}) {
  const t = useTranslations("carrier.newRide");
  const [mode, setMode] = useState<ReturnMode>(() => deriveMode(value));

  const outbound = {
    pickupCity: outboundPickupCity,
    pickupLocation: outboundPickupLocation,
    destinationCity: outboundDestinationCity,
    destinationLocation: outboundDestinationLocation,
    stops: outboundStops,
  };
  const defaultSwap = resolveReturnLeg(outbound, {});

  function seedEndpoints(current: ReturnTripValues): ReturnTripValues {
    if (current.returnPickupCity || current.returnDestinationCity) return current;
    return {
      ...current,
      returnPickupCity: defaultSwap.pickupCity,
      returnPickupLocation: defaultSwap.pickupLocation,
      returnDestinationCity: defaultSwap.destinationCity,
      returnDestinationLocation: defaultSwap.destinationLocation,
    };
  }

  function goToStopsMode() {
    setMode("stops");
    onChange({ ...value, returnStops: [...value.returnStops, { city: "", location: "" }] });
  }

  function goToCustomMode() {
    setMode("custom");
    onChange(seedEndpoints({ ...value, differentReturnRoute: true }));
  }

  function isUnchangedFromSeed(current: ReturnTripValues): boolean {
    return (
      current.returnStops.length === 0 &&
      (current.returnPickupCity === defaultSwap.pickupCity || !current.returnPickupCity) &&
      (current.returnPickupLocation === defaultSwap.pickupLocation || !current.returnPickupLocation) &&
      (current.returnDestinationCity === defaultSwap.destinationCity || !current.returnDestinationCity) &&
      (current.returnDestinationLocation === defaultSwap.destinationLocation || !current.returnDestinationLocation)
    );
  }

  function backToMirror() {
    if (!isUnchangedFromSeed(value) && !window.confirm(t("confirmBackToSameRoute"))) return;
    setMode("mirror");
    onChange({
      differentReturnRoute: false,
      returnPickupCity: "",
      returnPickupLocation: "",
      returnStops: [],
      returnDestinationCity: "",
      returnDestinationLocation: "",
    });
  }

  function addCustomStop() {
    if (value.returnStops.length >= 5) return;
    onChange({ ...value, returnStops: [...value.returnStops, { city: "", location: "" }] });
  }
  function removeStop(index: number) {
    const nextStops = value.returnStops.filter((_, i) => i !== index);
    onChange({ ...value, returnStops: nextStops });
    if (nextStops.length === 0 && mode === "stops") setMode("mirror");
  }
  function updateStop(index: number, patch: Partial<CityLocation>) {
    onChange({ ...value, returnStops: value.returnStops.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  const departureDateOnly = departureAt ? departureAt.split("T")[0] : undefined;

  return (
    <LegCard direction="return" title={t("povratak")} km={kmText}>
      {mode === "mirror" ? (
        <div className="truncate rounded-[8px] bg-[#FAFAFA] px-3 py-[10px] text-[14px]">
          <span className="font-medium text-[#18181B]">{outboundDestinationCity || "—"}</span>
          <span className="mx-[6px] text-[#A1A1AA]">→</span>
          <span className="font-medium text-[#18181B]">{outboundPickupCity || "—"}</span>
          <span className="text-[#A1A1AA]"> · {t("mirrorSuffix")}</span>
        </div>
      ) : mode === "stops" ? (
        <div className="flex flex-col">
          <div className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
            <div className="flex flex-col items-center">
              <div className="pt-[12px]">
                <RingMarker />
              </div>
              <Connector />
            </div>
            <div className="py-[12px]">
              <p className="text-[14px] font-medium text-[#18181B]">{outboundDestinationCity || "—"}</p>
              <p className="text-[13px] text-[#A1A1AA]">
                {outboundDestinationLocation ? `${outboundDestinationLocation} · ` : ""}
                {t("fromOutbound")}
              </p>
            </div>
          </div>

          {value.returnStops.map((stop, index) => (
            <div key={index} className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
              <div className="flex flex-col items-center">
                <div className="pt-[15px]">
                  <RingMarker />
                </div>
                <Connector />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_28px] gap-2 pb-[10px] pt-[1px]">
                <CityCombobox variant="sheet" value={stop.city} onChange={(v) => updateStop(index, { city: v })} />
                <Input
                  unstyled
                  className={SHEET_INPUT_CLASS}
                  value={stop.location}
                  placeholder={locationPlaceholder}
                  onChange={(e) => updateStop(index, { location: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="flex h-10 w-7 shrink-0 items-center justify-center self-center text-[#A1A1AA] hover:text-[#71717A]"
                >
                  <X size={15} strokeWidth={1.9} />
                </button>
              </div>
            </div>
          ))}

          <div className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
            <div className="flex flex-col items-center">
              <div className="pb-[12px]">
                <FilledMarker />
              </div>
            </div>
            <div className="py-[12px]">
              <p className="text-[14px] font-medium text-[#18181B]">{outboundPickupCity || "—"}</p>
              <p className="text-[13px] text-[#A1A1AA]">
                {outboundPickupLocation ? `${outboundPickupLocation} · ` : ""}
                {t("fromOutbound")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <RouteTimelineForReturn
          value={value}
          onChange={onChange}
          locationPlaceholder={locationPlaceholder}
          addStopLabel={t("addStop")}
        />
      )}

      <DateTimeRow
        dateValue={returnAt ? returnAt.split("T")[0] : ""}
        onDateChange={(d) => onReturnAtChange(`${d}T${returnAt.split("T")[1] || "00:00"}`)}
        timeValue={returnAt.split("T")[1] || ""}
        onTimeChange={(time) => onReturnAtChange(`${returnAt.split("T")[0] || departureDateOnly || ""}T${time}`)}
        minDate={departureDateOnly}
        dateRef={dateRef}
        datePlaceholder={datePlaceholder}
        timePlaceholder={timePlaceholder}
        dateError={Boolean(returnDateError)}
      />
      {returnDateError ? <p className="pl-[30px] text-[12.5px] text-[#DC2626]">{returnDateError}</p> : null}

      <div className="flex items-center gap-1">
        <button type="button" onClick={mode === "mirror" ? goToStopsMode : addCustomStop} className={SHEET_TEXT_BUTTON_CLASS}>
          <Plus size={14} strokeWidth={2} />
          {t("addStop")}
        </button>
        {mode !== "custom" ? (
          <button type="button" onClick={goToCustomMode} className={SHEET_TEXT_BUTTON_CLASS}>
            <Pencil size={14} strokeWidth={2} />
            {t("differentRoute")}
          </button>
        ) : (
          <button
            type="button"
            onClick={backToMirror}
            className="-ml-2 flex h-7 items-center gap-[6px] rounded-[7px] px-2 text-[13px] font-medium text-[#71717A] transition-colors duration-[.12s] ease-out hover:bg-[#F4F4F5]"
          >
            <RotateCcw size={14} strokeWidth={2} />
            {t("backToSameRoute")}
          </button>
        )}
      </div>
    </LegCard>
  );
}

// Custom-mode body — identical layout to Odlazak's timeline (§5.2 custom),
// reusing the exact same editable-row rendering via RouteTimeline so the
// two never drift apart visually.
function RouteTimelineForReturn({
  value,
  onChange,
  locationPlaceholder,
  addStopLabel,
}: {
  value: ReturnTripValues;
  onChange: (value: ReturnTripValues) => void;
  locationPlaceholder: string;
  addStopLabel: string;
}) {
  return (
    <RouteTimeline
      originCity={value.returnPickupCity}
      originLocation={value.returnPickupLocation}
      onOriginCityChange={(v: string) => onChange({ ...value, returnPickupCity: v })}
      onOriginLocationChange={(v: string) => onChange({ ...value, returnPickupLocation: v })}
      destinationCity={value.returnDestinationCity}
      destinationLocation={value.returnDestinationLocation}
      onDestinationCityChange={(v: string) => onChange({ ...value, returnDestinationCity: v })}
      onDestinationLocationChange={(v: string) => onChange({ ...value, returnDestinationLocation: v })}
      stops={value.returnStops}
      onAddStop={() => {
        if (value.returnStops.length >= 5) return;
        onChange({ ...value, returnStops: [...value.returnStops, { city: "", location: "" }] });
      }}
      onRemoveStop={(i: number) => onChange({ ...value, returnStops: value.returnStops.filter((_, idx) => idx !== i) })}
      onUpdateStop={(i: number, patch: Partial<CityLocation>) =>
        onChange({ ...value, returnStops: value.returnStops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) })
      }
      locationPlaceholder={locationPlaceholder}
      addStopLabel={addStopLabel}
    />
  );
}
