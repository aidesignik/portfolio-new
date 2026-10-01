"use client";

import { X } from "lucide-react";
import { CityCombobox, type CityComboboxHandle } from "@/components/forms/CityCombobox";

// §5.1 — "like Google Maps directions": one bordered field holding two
// inputs (city select, location text) split by an internal divider, rather
// than two separate field boxes. Still the same two underlying values/
// onChange handlers as any other city+location pair in this app.
export function GroupedRouteField({
  cityValue,
  onCityChange,
  cityPlaceholder,
  cityRef,
  locationValue,
  onLocationChange,
  locationPlaceholder,
  removable,
  onRemove,
  removeLabel,
}: {
  cityValue: string;
  onCityChange: (value: string) => void;
  cityPlaceholder: string;
  cityRef?: React.Ref<CityComboboxHandle>;
  locationValue: string;
  onLocationChange: (value: string) => void;
  locationPlaceholder: string;
  removable?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    // No overflow-hidden here — the divider border doesn't need clipping,
    // and this container also hosts the city combobox's suggestion
    // dropdown, which must be able to render outside these bounds.
    <div className="flex h-10 min-w-0 flex-1 items-stretch rounded-[8px] border border-[#E4E4E7] transition-shadow duration-[.12s] ease-out focus-within:border-[#2563EB] focus-within:shadow-[0_0_0_3px_#DBEAFE]">
      <CityCombobox
        ref={cityRef}
        variant="grouped"
        value={cityValue}
        onChange={onCityChange}
        placeholder={cityPlaceholder}
        className="min-w-0 flex-[1_1_0] border-r border-[#EEEEF0] pl-3 pr-[10px]"
      />
      <div className="flex min-w-0 flex-[1.2_1_0] items-center pl-3" style={{ paddingRight: removable ? 0 : 12 }}>
        <input
          value={locationValue}
          placeholder={locationPlaceholder}
          onChange={(e) => onLocationChange(e.target.value)}
          className="h-full min-w-0 flex-1 truncate bg-transparent text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none"
        />
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            title={removeLabel}
            aria-label={removeLabel}
            onMouseDown={(e) => e.preventDefault()}
            className="mr-[6px] flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[#A1A1AA] transition-colors duration-[.12s] ease-out hover:bg-[#F4F4F5] hover:text-[#52525B]"
          >
            <X size={14} strokeWidth={1.9} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
