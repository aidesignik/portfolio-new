"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { tripStateToQueryString, type TripSearchState } from "@/lib/tripQueryParams";
import type { CityLocation } from "@/lib/location";

export function PublicSearchForm({ defaults }: { defaults: TripSearchState }) {
  const t = useTranslations("client.requestForm");
  const router = useRouter();
  const [form, setForm] = useState<TripSearchState>(defaults);

  function addStop() {
    if (form.stops.length >= 5) return;
    setForm({ ...form, stops: [...form.stops, { city: "", location: "" }] });
  }

  function removeStop(index: number) {
    setForm({ ...form, stops: form.stops.filter((_, i) => i !== index) });
  }

  function updateStop(index: number, patch: Partial<CityLocation>) {
    setForm({
      ...form,
      stops: form.stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)),
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(`/?${tripStateToQueryString(form)}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <CityLocationFields
        cityLabel={t("pickupCity")}
        locationLabel={t("pickupLocation")}
        city={form.pickupCity}
        location={form.pickupLocation}
        onCityChange={(v) => setForm({ ...form, pickupCity: v })}
        onLocationChange={(v) => setForm({ ...form, pickupLocation: v })}
      />

      {form.stops.map((stop, index) => (
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

      {form.stops.length < 5 ? (
        <button type="button" onClick={addStop} className="text-sm font-medium text-zinc-700 underline">
          + {t("addStop")}
        </button>
      ) : null}

      <CityLocationFields
        cityLabel={t("destinationCity")}
        locationLabel={t("destinationLocation")}
        city={form.destinationCity}
        location={form.destinationLocation}
        onCityChange={(v) => setForm({ ...form, destinationCity: v })}
        onLocationChange={(v) => setForm({ ...form, destinationLocation: v })}
      />

      <Field label={t("departureAt")}>
        <Input
          type="datetime-local"
          required
          value={form.departureAt}
          onChange={(e) => setForm({ ...form, departureAt: e.target.value })}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isRoundTrip}
          onChange={(e) => setForm({ ...form, isRoundTrip: e.target.checked })}
        />
        {t("isRoundTrip")}
      </label>

      {form.isRoundTrip ? (
        <Field label={t("returnAt")}>
          <Input
            type="datetime-local"
            required
            min={form.departureAt || undefined}
            value={form.returnAt}
            onChange={(e) => setForm({ ...form, returnAt: e.target.value })}
          />
        </Field>
      ) : null}

      <Field label={t("passengerCount")}>
        <Input
          type="number"
          min={1}
          required
          value={form.passengerCount}
          onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
        />
      </Field>

      <Button type="submit" className="w-full">
        {t("search")}
      </Button>
    </form>
  );
}
