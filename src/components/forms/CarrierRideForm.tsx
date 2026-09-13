"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { suggestPrice } from "@/lib/pricing";
import type { CityLocation } from "@/lib/location";

type Vehicle = { id: string; type: string; model: string; seats: number };
type Driver = { id: string; name: string };

export function CarrierRideForm({
  vehicles,
  drivers,
  carrierRates,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  carrierRates: { ratePerKm: number | null; fixedFee: number | null };
}) {
  const t = useTranslations();
  const router = useRouter();
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
    vehicleId: vehicles[0]?.id ?? "",
    driverId: drivers[0]?.id ?? "",
    distanceKm: "",
    finalPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(() => {
    const km = Number(form.distanceKm);
    if (!km || km <= 0) return null;
    return suggestPrice(km, carrierRates);
  }, [form.distanceKm, carrierRates]);

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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/carrier/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientPhone: form.clientPhone || undefined,
        returnAt: form.isRoundTrip ? form.returnAt : undefined,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
        finalPrice: Number(form.finalPrice || suggested || 0),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body?.error === "UNAVAILABLE") {
        setError(t("carrier.offerForm.unavailable"));
      } else if (body?.error === "DISTANCE_UNAVAILABLE") {
        setError(t("carrier.rideForm.distanceUnavailable"));
      } else {
        setError(t("common.saveFailed"));
      }
      return;
    }

    const { booking } = await res.json();
    router.push(`/carrier/bookings/${booking.id}`);
    router.refresh();
  }

  if (vehicles.length === 0 || drivers.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        {t("carrier.noVehicles")} / {t("carrier.noDrivers")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">{t("carrier.rideForm.clientSection")}</h2>
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
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">{t("carrier.rideForm.tripSection")}</h2>

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
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">{t("carrier.rideForm.assignmentSection")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("carrier.offerForm.vehicle")}>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {t(`vehicleType.${v.type}`)} {v.model} ({v.seats} seats)
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("carrier.offerForm.driver")}>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t("carrier.rideForm.distanceKmOptional")}>
          <Input
            type="number"
            min={1}
            step="0.1"
            placeholder={t("carrier.rideForm.distanceKmPlaceholder")}
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
          />
        </Field>

        {suggested !== null ? (
          <p className="text-sm text-zinc-600">
            {t("carrier.offerForm.suggestedPrice")}: <span className="font-medium text-zinc-900">{suggested} RSD</span>
          </p>
        ) : null}

        <Field label={t("carrier.offerForm.finalPrice")}>
          <Input
            type="number"
            min={1}
            step="0.01"
            required
            placeholder={suggested ? String(suggested) : undefined}
            value={form.finalPrice}
            onChange={(e) => setForm({ ...form, finalPrice: e.target.value })}
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("carrier.rideForm.submit")}
      </Button>
    </form>
  );
}
