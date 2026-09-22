"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { SidePanel } from "@/components/ui/SidePanel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { PanelFooter } from "@/components/ui/PanelFooter";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { EMPTY_RETURN_TRIP, returnTripPayload, ReturnTripFields } from "@/components/forms/ReturnTripFields";
import { fetchWithAvailabilityConfirm } from "@/lib/availabilityConfirm";
import type { CityLocation } from "@/lib/location";
import type { CalendarDriver, CalendarVehicle } from "./types";

const DEPARTURE_JUMP_DEBOUNCE_MS = 400;

export function NewRideModal({
  onClose,
  onCreated,
  onDepartureDateChange,
}: {
  onClose: () => void;
  onCreated: () => void;
  // Lets the calendar underneath jump to the picked date's week as the
  // dispatcher fills in the form, for live context — optional so this
  // component doesn't need a caller that wires it up.
  onDepartureDateChange?: (date: Date) => void;
}) {
  const t = useTranslations();
  const tType = useTranslations("vehicleType");
  const [form, setForm] = useState({
    clientCompanyName: "",
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

  useEffect(() => {
    if (!onDepartureDateChange || !form.departureAt) return;
    const timer = setTimeout(() => {
      const date = new Date(form.departureAt);
      if (!Number.isNaN(date.getTime())) onDepartureDateChange(date);
    }, DEPARTURE_JUMP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [form.departureAt, onDepartureDateChange]);

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

    const { response: res, declinedAvailability } = await fetchWithAvailabilityConfirm(
      "/api/carrier/rides/quick",
      "POST",
      {
        ...form,
        clientCompanyName: form.clientCompanyName || undefined,
        clientPhone: form.clientPhone || undefined,
        returnAt: form.isRoundTrip ? form.returnAt : undefined,
        ...returnTripPayload(form.isRoundTrip, form.returnTrip),
        vehicleId: form.vehicleId || undefined,
        driverId: form.driverId || undefined,
      },
      (start, end) => t("carrier.calendar.availabilityWarning", { start, end }),
    );

    setLoading(false);

    if (!res.ok) {
      // Declining the warning isn't a real failure — no error, just stay
      // on the form so the dispatcher can adjust and retry.
      if (!declinedAvailability) setError(t("common.saveFailed"));
      return;
    }

    onCreated();
  }

  return (
    <SidePanel onClose={onClose}>
      <PanelHeader title={t("carrier.calendar.newRideTitle")} onClose={onClose} closeLabel={t("common.close")} />

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-[18px] overflow-y-auto px-5 py-[18px]">
          <div className="grid gap-[10px] sm:grid-cols-2">
            <Field label={t("carrier.rideForm.client")}>
              <Input
                placeholder={t("carrier.rideForm.clientPlaceholder")}
                value={form.clientCompanyName}
                onChange={(e) => setForm({ ...form, clientCompanyName: e.target.value })}
              />
            </Field>
            <Field label={t("carrier.rideForm.contactPerson")}>
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
            <div key={index} className="space-y-2 rounded-[10px] border-[1.5px] border-dashed border-[var(--border-strong)] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[var(--ink-muted)]">
                  {t("client.requestForm.stop")} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="text-[12.5px] font-semibold text-[#7F1D1D] hover:underline"
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
            <button type="button" onClick={addStop} className="text-[14px] font-semibold text-[var(--action-bg)] hover:underline">
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

          <label className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
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

          <div className="space-y-2 rounded-[10px] border border-[var(--border-hairline)] p-3">
            <p className="text-[13px] font-semibold text-[var(--ink-2)]">{t("carrier.calendar.assignNowTitle")}</p>
            <p className="text-[12.5px] text-[var(--ink-muted)]">
              {form.departureAt ? t("carrier.calendar.assignNowHint") : t("carrier.calendar.assignNowHintNoDate")}
            </p>
            <div className="grid gap-[10px] sm:grid-cols-2">
              <Field label={t("carrier.offerForm.vehicle")}>
                <Select
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
                </Select>
              </Field>
              <Field label={t("carrier.offerForm.driver")}>
                <Select
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
                </Select>
              </Field>
            </div>
            {loadingAvailability ? (
              <p className="text-[12.5px] text-[var(--ink-muted)]">{t("common.loading")}</p>
            ) : form.departureAt && availableVehicles.length === 0 && availableDrivers.length === 0 ? (
              <p className="text-[12.5px] text-[var(--ink-muted)]">{t("carrier.calendar.noneAvailableThatDay")}</p>
            ) : null}
          </div>

          {error ? <p className="text-[13.5px] text-[#7F1D1D]">{error}</p> : null}
        </div>

        <PanelFooter
          onCancel={onClose}
          cancelLabel={t("common.cancel")}
          submitLabel={t("carrier.calendar.newRideSubmit")}
          loading={loading}
          loadingLabel={t("common.loading")}
        />
      </form>
    </SidePanel>
  );
}
