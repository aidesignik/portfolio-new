"use client";

import { Plus, X } from "lucide-react";
import { CityCombobox } from "@/components/forms/CityCombobox";
import { Input } from "@/components/ui/Input";
import type { CityLocation } from "@/lib/location";
import { FilledMarker, RingMarker, Connector } from "./timelineMarkers";
import { SHEET_INPUT_CLASS } from "./sheetFieldClasses";

// Fully editable origin → stops → destination timeline (§5.1) — used for
// Odlazak and, identically, for Povratak's "custom" mode (§5.2 custom: "Same
// layout as Odlazak"). Pure presentation over the same stop add/remove/
// update handlers every ride form already uses — no logic here, just the
// new layout.
export function RouteTimeline({
  originCity,
  originLocation,
  onOriginCityChange,
  onOriginLocationChange,
  destinationCity,
  destinationLocation,
  onDestinationCityChange,
  onDestinationLocationChange,
  stops,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
  locationPlaceholder,
  addStopLabel,
  maxStops = 5,
}: {
  originCity: string;
  originLocation: string;
  onOriginCityChange: (v: string) => void;
  onOriginLocationChange: (v: string) => void;
  destinationCity: string;
  destinationLocation: string;
  onDestinationCityChange: (v: string) => void;
  onDestinationLocationChange: (v: string) => void;
  stops: CityLocation[];
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onUpdateStop: (index: number, patch: Partial<CityLocation>) => void;
  locationPlaceholder: string;
  addStopLabel: string;
  maxStops?: number;
}) {
  return (
    <div className="flex flex-col">
      <div className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
        <div className="flex flex-col items-center">
          <div className="pt-[15px]">
            <FilledMarker />
          </div>
          <Connector />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-2 pb-[10px] pt-[1px]">
          <CityCombobox variant="sheet" value={originCity} onChange={onOriginCityChange} />
          <Input
            unstyled
            className={SHEET_INPUT_CLASS}
            value={originLocation}
            placeholder={locationPlaceholder}
            onChange={(e) => onOriginLocationChange(e.target.value)}
          />
        </div>
      </div>

      {stops.map((stop, index) => (
        <div key={index} className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
          <div className="flex flex-col items-center">
            <div className="pt-[15px]">
              <RingMarker />
            </div>
            <Connector />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_28px] gap-2 pb-[10px] pt-[1px]">
            <CityCombobox
              variant="sheet"
              value={stop.city}
              onChange={(v) => onUpdateStop(index, { city: v })}
            />
            <Input
              unstyled
              className={SHEET_INPUT_CLASS}
              value={stop.location}
              placeholder={locationPlaceholder}
              onChange={(e) => onUpdateStop(index, { location: e.target.value })}
            />
            <button
              type="button"
              onClick={() => onRemoveStop(index)}
              className="flex h-10 w-7 shrink-0 items-center justify-center self-center text-[#A1A1AA] transition-colors duration-[.12s] ease-out hover:text-[#71717A]"
            >
              <X size={15} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      ))}

      <div className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
        <div className="flex flex-col items-center">
          <Connector />
        </div>
        <div className="py-[6px]">
          {stops.length < maxStops ? (
            <button type="button" onClick={onAddStop} className="-ml-2 flex h-7 items-center gap-[6px] rounded-[7px] px-2 text-[13px] font-medium text-[#2563EB] transition-colors duration-[.12s] ease-out hover:bg-[#EFF6FF]">
              <Plus size={14} strokeWidth={2} />
              {addStopLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-x-[10px]" style={{ gridTemplateColumns: "20px minmax(0,1fr)" }}>
        <div className="flex flex-col items-center">
          <div className="pt-[15px]">
            <RingMarker />
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-2 pt-[1px]">
          <CityCombobox variant="sheet" value={destinationCity} onChange={onDestinationCityChange} />
          <Input
            unstyled
            className={SHEET_INPUT_CLASS}
            value={destinationLocation}
            placeholder={locationPlaceholder}
            onChange={(e) => onDestinationLocationChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
