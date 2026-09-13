"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import type { CityLocation } from "@/lib/location";

export function NewRideModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations();
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    pickupCity: "",
    pickupLocation: "",
    destinationCity: "",
    destinationLocation: "",
    stops: [] as CityLocation[],
    departureAt: "",
    isRoundTrip: false,
    returnAt: "",
    passengerCount: "40",
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStop() {
    if (form.stops.length >= 5) return;
    setForm({ ...form, stops: [...form.stops, { city: "", location: "" }] });
  }
  function removeStop(index: number) {
    setForm({ ...form, stops: form.stops.filter((_, i) => i !== index) });
  }
  function updateStop(index: number, patch: Partial<CityLocation>) {
    setForm({ ...form, stops: form.stops.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/carrier/rides/quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientPhone: form.clientPhone || undefined,
        returnAt: form.isRoundTrip ? form.returnAt : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(t("common.saveFailed"));
      return;
    }

    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">{t("carrier.calendar.newRideTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-zinc-400 hover:text-zinc-700"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("common.name")}>
              <Input
                required
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
            </Field>
            <Field label={t("common.email")}>
              <Input
                type="email"
                required
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
              />
            </Field>
            <Field label={t("common.phone")}>
              <Input
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
              />
            </Field>
          </div>

          <CityLocationFields
            cityLabel={t("client.requestForm.pickupCity")}
            locationLabel={t("client.requestForm.pickupLocation")}
            city={form.pickupCity}
            location={form.pickupLocation}
            onCityChange={(v) => setForm({ ...form, pickupCity: v })}
            onLocationChange={(v) => setForm({ ...form, pickupLocation: v })}
          />

          {form.stops.map((stop, index) => (
            <div key={index} className="space-y-2 rounded-md border border-dashed border-zinc-300 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {t("client.requestForm.stop")} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t("client.requestForm.removeStop")}
                </button>
              </div>
              <CityLocationFields
                cityLabel={t("client.requestForm.pickupCity")}
                locationLabel={t("client.requestForm.pickupLocation")}
                city={stop.city}
                location={stop.location}
                onCityChange={(v) => updateStop(index, { city: v })}
                onLocationChange={(v) => updateStop(index, { location: v })}
              />
            </div>
          ))}
          {form.stops.length < 5 ? (
            <button type="button" onClick={addStop} className="text-sm font-medium text-zinc-700 underline">
              + {t("client.requestForm.addStop")}
            </button>
          ) : null}

          <CityLocationFields
            cityLabel={t("client.requestForm.destinationCity")}
            locationLabel={t("client.requestForm.destinationLocation")}
            city={form.destinationCity}
            location={form.destinationLocation}
            onCityChange={(v) => setForm({ ...form, destinationCity: v })}
            onLocationChange={(v) => setForm({ ...form, destinationLocation: v })}
          />

          <Field label={t("client.requestForm.departureAt")}>
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
            {t("client.requestForm.isRoundTrip")}
          </label>

          {form.isRoundTrip ? (
            <Field label={t("client.requestForm.returnAt")}>
              <Input
                type="datetime-local"
                required
                min={form.departureAt || undefined}
                value={form.returnAt}
                onChange={(e) => setForm({ ...form, returnAt: e.target.value })}
              />
            </Field>
          ) : null}

          <Field label={t("client.requestForm.passengerCount")}>
            <Input
              type="number"
              min={1}
              required
              value={form.passengerCount}
              onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
            />
          </Field>

          <Field label={t("client.requestForm.specialRequests")}>
            <Input
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
            />
          </Field>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("common.loading") : t("carrier.calendar.newRideSubmit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
