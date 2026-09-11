"use client";

import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { COMMON_CITIES } from "@/lib/location";

export function CityLocationFields({
  idPrefix,
  cityLabel,
  locationLabel,
  city,
  location,
  onCityChange,
  onLocationChange,
}: {
  idPrefix: string;
  cityLabel: string;
  locationLabel: string;
  city: string;
  location: string;
  onCityChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}) {
  const listId = `${idPrefix}-cities`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={cityLabel}>
        <Input list={listId} required value={city} onChange={(e) => onCityChange(e.target.value)} />
        <datalist id={listId}>
          {COMMON_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label={locationLabel}>
        <Input required value={location} onChange={(e) => onLocationChange(e.target.value)} />
      </Field>
    </div>
  );
}
