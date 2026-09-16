"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { DocumentDownloads } from "@/components/forms/DocumentDownloads";
import type { CityLocation } from "@/lib/location";
import type { CalendarDriver, CalendarRide, CalendarVehicle } from "./types";

const STATUS_TONE: Record<CalendarRide["status"], "warning" | "positive" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "positive",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
};

function toDateTimeInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildEditForm(ride: CalendarRide) {
  return {
    pickupCity: ride.pickupCity,
    pickupLocation: ride.pickupLocation,
    destinationCity: ride.destinationCity,
    destinationLocation: ride.destinationLocation,
    stops: ride.stops,
    departureAt: toDateTimeInputValue(ride.departureAt),
    isRoundTrip: ride.isRoundTrip,
    returnAt: ride.returnAt ? toDateTimeInputValue(ride.returnAt) : "",
    passengerCount: String(ride.passengerCount),
    specialRequests: ride.specialRequests ?? "",
  };
}

export function RideDetailDrawer({
  ride,
  vehicles,
  drivers,
  onClose,
  onChanged,
}: {
  ride: CalendarRide;
  vehicles: CalendarVehicle[];
  drivers: CalendarDriver[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations();
  const tType = useTranslations("vehicleType");
  const [reassigning, setReassigning] = useState(false);
  const [vehicleId, setVehicleId] = useState(ride.vehicleId ?? vehicles[0]?.id ?? "");
  const [driverId, setDriverId] = useState(ride.driverId ?? drivers[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(() => buildEditForm(ride));
  const [editError, setEditError] = useState<string | null>(null);
  const editable = ride.status !== "CANCELLED" && ride.status !== "COMPLETED";

  const vehicle = vehicles.find((v) => v.id === ride.vehicleId);
  const driver = drivers.find((d) => d.id === ride.driverId);

  function addStop() {
    if (editForm.stops.length >= 5) return;
    setEditForm({ ...editForm, stops: [...editForm.stops, { city: "", location: "" }] });
  }
  function removeStop(index: number) {
    setEditForm({ ...editForm, stops: editForm.stops.filter((_, i) => i !== index) });
  }
  function updateStop(index: number, patch: Partial<CityLocation>) {
    setEditForm({
      ...editForm,
      stops: editForm.stops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  async function saveEdit() {
    setBusy("edit");
    setEditError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        returnAt: editForm.isRoundTrip ? editForm.returnAt : undefined,
        passengerCount: Number(editForm.passengerCount),
        specialRequests: editForm.specialRequests || undefined,
      }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setEditError(body?.error === "UNAVAILABLE" ? t("carrier.offerForm.unavailable") : t("common.saveFailed"));
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function reassign() {
    setBusy("reassign");
    setError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, driverId }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error === "UNAVAILABLE" ? t("carrier.offerForm.unavailable") : t("common.saveFailed"));
      return;
    }
    setReassigning(false);
    onChanged();
  }

  async function cancelRide() {
    if (!confirm(t("carrier.calendar.cancelConfirm"))) return;
    setBusy("cancel");
    setError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}/cancel`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      setError(t("common.saveFailed"));
      return;
    }
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {ride.pickupCity} → {ride.destinationCity}
            </h2>
            <p className="text-sm text-zinc-600">{new Date(ride.departureAt).toLocaleString()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {editable && !editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditForm(buildEditForm(ride));
                  setEditError(null);
                  setEditing(true);
                }}
                className="text-zinc-400 hover:text-zinc-700"
                aria-label={t("common.edit")}
                title={t("common.edit")}
              >
                ✎
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700"
              aria-label={t("common.close")}
            >
              ✕
            </button>
          </div>
        </div>

        <Badge tone={STATUS_TONE[ride.status]}>{t(`rideStatus.${ride.status}`)}</Badge>

        <div className="mt-4 space-y-1 border-t border-zinc-200 pt-4 text-sm">
          <p className="text-zinc-900">{ride.client.name ?? "—"}</p>
          <p className="text-zinc-600">{ride.client.phone}</p>
        </div>

        <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
          {!editing ? (
            <div className="space-y-1 text-sm">
              <p className="text-zinc-600">
                {ride.pickupLocation} → {ride.destinationLocation}
              </p>
              {ride.isRoundTrip && ride.returnAt ? (
                <p className="text-zinc-600">
                  {t("client.requestForm.returnAt")}: {new Date(ride.returnAt).toLocaleString()}
                </p>
              ) : null}
              <p className="text-zinc-600">{ride.passengerCount} {t("carrier.calendar.pax")}</p>
              {ride.specialRequests ? <p className="text-zinc-700">{ride.specialRequests}</p> : null}
            </div>
          ) : (
            <div className="space-y-3">
              <CityLocationFields
                cityLabel={t("client.requestForm.pickupCity")}
                locationLabel={t("client.requestForm.pickupLocation")}
                city={editForm.pickupCity}
                location={editForm.pickupLocation}
                onCityChange={(v) => setEditForm({ ...editForm, pickupCity: v })}
                onLocationChange={(v) => setEditForm({ ...editForm, pickupLocation: v })}
              />

              {editForm.stops.map((stop, index) => (
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
              {editForm.stops.length < 5 ? (
                <button type="button" onClick={addStop} className="text-sm font-medium text-zinc-700 underline">
                  + {t("client.requestForm.addStop")}
                </button>
              ) : null}

              <CityLocationFields
                cityLabel={t("client.requestForm.destinationCity")}
                locationLabel={t("client.requestForm.destinationLocation")}
                city={editForm.destinationCity}
                location={editForm.destinationLocation}
                onCityChange={(v) => setEditForm({ ...editForm, destinationCity: v })}
                onLocationChange={(v) => setEditForm({ ...editForm, destinationLocation: v })}
              />

              <Field label={t("client.requestForm.departureAt")}>
                <Input
                  type="datetime-local"
                  required
                  value={editForm.departureAt}
                  onChange={(e) => setEditForm({ ...editForm, departureAt: e.target.value })}
                />
              </Field>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isRoundTrip}
                  onChange={(e) => setEditForm({ ...editForm, isRoundTrip: e.target.checked })}
                />
                {t("client.requestForm.isRoundTrip")}
              </label>

              {editForm.isRoundTrip ? (
                <Field label={t("client.requestForm.returnAt")}>
                  <Input
                    type="datetime-local"
                    required
                    min={editForm.departureAt || undefined}
                    value={editForm.returnAt}
                    onChange={(e) => setEditForm({ ...editForm, returnAt: e.target.value })}
                  />
                </Field>
              ) : null}

              <Field label={t("client.requestForm.passengerCount")}>
                <Input
                  type="number"
                  min={1}
                  required
                  value={editForm.passengerCount}
                  onChange={(e) => setEditForm({ ...editForm, passengerCount: e.target.value })}
                />
              </Field>

              <Field label={t("client.requestForm.specialRequests")}>
                <Input
                  value={editForm.specialRequests}
                  onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                />
              </Field>

              {editError ? <p className="text-sm text-red-600">{editError}</p> : null}

              <div className="flex gap-2">
                <Button type="button" disabled={busy === "edit"} onClick={saveEdit}>
                  {busy === "edit" ? t("common.loading") : t("common.save")}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
          {!reassigning ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-700">
                {vehicle ? `${tType(vehicle.type)} ${vehicle.model}` : t("carrier.calendar.noVehicleAssigned")}
                {driver ? ` · ${driver.name}` : ""}
              </p>
              <Button type="button" variant="secondary" onClick={() => setReassigning(true)}>
                {t("carrier.calendar.reassign")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {tType(v.type)} {v.model}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" disabled={busy === "reassign"} onClick={reassign}>
                  {busy === "reassign" ? t("common.loading") : t("common.save")}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReassigning(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {ride.price !== null ? (
          <p className="mt-4 text-lg font-semibold text-zinc-900">
            {Number(ride.price).toLocaleString()} {ride.currency}
          </p>
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
          {ride.status !== "CANCELLED" && ride.status !== "COMPLETED" ? (
            <Button type="button" variant="danger" disabled={busy === "cancel"} onClick={cancelRide}>
              {busy === "cancel" ? t("common.loading") : t("carrier.calendar.cancelRide")}
            </Button>
          ) : null}
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t("documents.generateAll")}</h3>
          <DocumentDownloads bookingId={ride.id} initialDocuments={[]} />
        </div>
      </div>
    </div>
  );
}
