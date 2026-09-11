"use client";

import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CityCombobox } from "@/components/forms/CityCombobox";

export function CityLocationFields({
  cityLabel,
  locationLabel,
  city,
  location,
  onCityChange,
  onLocationChange,
}: {
  cityLabel: string;
  locationLabel: string;
  city: string;
  location: string;
  onCityChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={cityLabel}>
        <CityCombobox required value={city} onChange={onCityChange} />
      </Field>
      <Field label={locationLabel}>
        <Input required value={location} onChange={(e) => onLocationChange(e.target.value)} />
      </Field>
    </div>
  );
}
