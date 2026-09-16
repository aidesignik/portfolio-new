"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { EMPTY_RETURN_TRIP, returnTripPayload, ReturnTripFields } from "@/components/forms/ReturnTripFields";
import type { CityLocation } from "@/lib/location";
import type { CalendarDriver, CalendarVehicle } from "./types";

export function NewRideModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations();
  const tType = useTranslations("vehicleType");
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
    returnTrip: EMPTY_RETURN_TRIP,
    passengerCount: "40",
    specialRequests: "",
    vehicleId: "",
    driverId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableVehicles, setAvailableVehicles] = useState<CalendarVehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<CalendarDriver[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    // Always fetch — with no date picked yet this just returns the whole
    // fleet/roster unfiltered (see the API route), so the fields are
    // populated and visible as soon as the modal opens, then narrow down
    // to who's actually free once a date (and, for a round trip, a return
    // date) is picked.
    let cancelled = false;
    // No data-fetching library here to restructure this around — same
    // accepted pattern as RidesCalendar's load().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingAvailability(true);
    const params = new URLSearchParams();
    if (form.departureAt) {
      params.set("departureAt", new Date(form.departureAt).toISOString());
      if (form.isRoundTrip && form.returnAt) {
        params.set("returnAt", new Date(form.returnAt).toISOString());
      }
    }
    fetch(`/api/carrier/availability/resources?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setAvailableVehicles(data.vehicles);
        setAvailableDrivers(data.drivers);
        // Drop a previously picked resource if it's no longer free for the
        // (now different) date/time.
        setForm((prev) => ({
          ...prev,
          vehicleId: data.vehicles.some((v: CalendarVehicle) => v.id === prev.vehicleId) ? prev.vehicleId : "",
          driverId: data.drivers.some((d: CalendarDriver) => d.id === prev.driverId) ? prev.driverId : "",
        }));
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.departureAt, form.isRoundTrip, form.returnAt]);

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
        ...returnTripPayload(form.isRoundTrip, form.returnTrip),
        vehicleId: form.vehicleId || undefined,
        driverId: form.driverId || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(
        body?.error === "UNAVAILABLE"
          ? t("carrier.calendar.newRideAssignmentUnavailable")
          : t("common.saveFailed"),
      );
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
            <>
              <Field label={t("client.requestForm.returnAt")}>
                <Input
                  type="datetime-local"
                  required
                  min={form.departureAt || undefined}
                  value={form.returnAt}
                  onChange={(e) => setForm({ ...form, returnAt: e.target.value })}
                />
              </Field>
              <ReturnTripFields
                value={form.returnTrip}
                onChange={(returnTrip) => setForm({ ...form, returnTrip })}
                outboundPickupCity={form.pickupCity}
                outboundPickupLocation={form.pickupLocation}
                outboundDestinationCity={form.destinationCity}
                outboundDestinationLocation={form.destinationLocation}
                outboundStops={form.stops}
              />
            </>
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

          <div className="space-y-2 rounded-md border border-zinc-200 p-3">
            <p className="text-sm font-medium text-zinc-700">{t("carrier.calendar.assignNowTitle")}</p>
            <p className="text-xs text-zinc-500">
              {form.departureAt ? t("carrier.calendar.assignNowHint") : t("carrier.calendar.assignNowHintNoDate")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("carrier.offerForm.vehicle")}>
                <select
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  disabled={loadingAvailability}
                >
                  <option value="">{t("carrier.calendar.assignLater")}</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {tType(v.type)} {v.model}
                      {v.licensePlate ? ` · ${v.licensePlate}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("carrier.offerForm.driver")}>
                <select
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                  disabled={loadingAvailability}
                >
                  <option value="">{t("carrier.calendar.assignLater")}</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {loadingAvailability ? (
              <p className="text-xs text-zinc-500">{t("common.loading")}</p>
            ) : form.departureAt && availableVehicles.length === 0 && availableDrivers.length === 0 ? (
              <p className="text-xs text-zinc-500">{t("carrier.calendar.noneAvailableThatDay")}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("common.loading") : t("carrier.calendar.newRideSubmit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
