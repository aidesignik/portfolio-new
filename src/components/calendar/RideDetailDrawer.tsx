"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { SidePanel } from "@/components/ui/SidePanel";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { AssignmentChip, EmptyAssignmentChip } from "@/components/ui/AssignmentChip";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { EMPTY_RETURN_TRIP, returnTripPayload, ReturnTripFields } from "@/components/forms/ReturnTripFields";
import { DocumentDownloads } from "@/components/forms/DocumentDownloads";
import { fetchWithAvailabilityConfirm } from "@/lib/availabilityConfirm";
import { clientDisplayName } from "@/lib/clientDisplay";
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
  const hasReturnOverride = Boolean(ride.returnPickupCity || ride.returnDestinationCity);
  return {
    pickupCity: ride.pickupCity,
    pickupLocation: ride.pickupLocation,
    destinationCity: ride.destinationCity,
    destinationLocation: ride.destinationLocation,
    stops: ride.stops,
    departureAt: toDateTimeInputValue(ride.departureAt),
    isRoundTrip: ride.isRoundTrip,
    returnAt: ride.returnAt ? toDateTimeInputValue(ride.returnAt) : "",
    returnTrip: hasReturnOverride
      ? {
          differentReturnRoute: true,
          returnPickupCity: ride.returnPickupCity ?? "",
          returnPickupLocation: ride.returnPickupLocation ?? "",
          returnStops: ride.returnStops,
          returnDestinationCity: ride.returnDestinationCity ?? "",
          returnDestinationLocation: ride.returnDestinationLocation ?? "",
        }
      : EMPTY_RETURN_TRIP,
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
    const { response: res, declinedAvailability } = await fetchWithAvailabilityConfirm(
      `/api/carrier/rides/${ride.id}`,
      "PATCH",
      {
        ...editForm,
        returnAt: editForm.isRoundTrip ? editForm.returnAt : undefined,
        ...returnTripPayload(editForm.isRoundTrip, editForm.returnTrip),
        passengerCount: Number(editForm.passengerCount),
        specialRequests: editForm.specialRequests || undefined,
      },
      (start, end) => t("carrier.calendar.availabilityWarning", { start, end }),
    );
    setBusy(null);
    if (!res.ok) {
      // Declining the warning isn't a real failure — no error, just stay
      // in edit mode so the dispatcher can adjust and retry.
      if (!declinedAvailability) setEditError(t("common.saveFailed"));
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function reassign() {
    setBusy("reassign");
    setError(null);
    const { response: res, declinedAvailability } = await fetchWithAvailabilityConfirm(
      `/api/carrier/rides/${ride.id}/assign`,
      "POST",
      { vehicleId, driverId },
      (start, end) => t("carrier.calendar.availabilityWarning", { start, end }),
    );
    setBusy(null);
    if (!res.ok) {
      // Declining the warning isn't a real failure — no error, just stay
      // in reassign mode so the dispatcher can adjust and retry.
      if (!declinedAvailability) setError(t("common.saveFailed"));
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
    <SidePanel onClose={onClose}>
      <div className="shrink-0 border-b border-[var(--border-soft)] px-5 py-[18px]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-[18px] font-bold text-[var(--ink-primary)]">
              {ride.pickupCity} → {ride.destinationCity}
              {ride.isRoundTrip ? ` → ${ride.pickupCity}` : ""}
            </h2>
            <p className="mt-[2px] text-[12.5px] text-[var(--ink-muted)]">{clientDisplayName(ride.client)}</p>
            <p className="font-mono text-[12.5px] text-[var(--ink-muted)]">
              {new Date(ride.departureAt).toLocaleString()}
            </p>
            {ride.isRoundTrip && ride.returnAt ? (
              <p className="font-mono text-[12.5px] text-[var(--ink-muted)]">
                {t("client.requestForm.returnAt")}: {new Date(ride.returnAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {editable && !editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditForm(buildEditForm(ride));
                  setEditError(null);
                  setEditing(true);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--ink-disabled)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)] hover:text-[var(--ink-2)]"
                aria-label={t("common.edit")}
                title={t("common.edit")}
              >
                <Pencil size={16} strokeWidth={1.9} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--ink-disabled)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)] hover:text-[var(--ink-2)]"
              aria-label={t("common.close")}
            >
              <X size={17} strokeWidth={1.9} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <Badge tone={STATUS_TONE[ride.status]}>{t(`rideStatus.${ride.status}`)}</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="space-y-1 text-[13.5px]">
          {ride.client.companyName ? <p className="text-[var(--ink-secondary)]">{ride.client.name ?? "—"}</p> : null}
          <p className="text-[var(--ink-secondary)]">{ride.client.phone}</p>
        </div>

        <div className="mt-4 space-y-3 border-t border-[var(--border-soft)] pt-4">
          {!editing ? (
            <div className="space-y-1 text-[13.5px]">
              <p className="text-[var(--ink-secondary)]">
                {ride.pickupLocation} → {ride.destinationLocation}
              </p>
              {ride.isRoundTrip && (ride.returnPickupCity || ride.returnDestinationCity) ? (
                <p className="text-[var(--ink-secondary)]">
                  {t("client.requestForm.differentReturnRoute")}:{" "}
                  {ride.returnPickupLocation ?? ride.destinationLocation} →{" "}
                  {ride.returnDestinationLocation ?? ride.pickupLocation}
                </p>
              ) : null}
              <p className="text-[var(--ink-secondary)]">
                {ride.passengerCount} {t("carrier.calendar.pax")}
              </p>
              {ride.specialRequests ? <p className="text-[var(--ink-2)]">{ride.specialRequests}</p> : null}
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
              {editForm.stops.length < 5 ? (
                <button type="button" onClick={addStop} className="text-[14px] font-semibold text-[var(--action-bg)] hover:underline">
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

              <label className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
                <input
                  type="checkbox"
                  checked={editForm.isRoundTrip}
                  onChange={(e) => setEditForm({ ...editForm, isRoundTrip: e.target.checked })}
                />
                {t("client.requestForm.isRoundTrip")}
              </label>

              {editForm.isRoundTrip ? (
                <>
                  <Field label={t("client.requestForm.returnAt")}>
                    <Input
                      type="datetime-local"
                      required
                      min={editForm.departureAt || undefined}
                      value={editForm.returnAt}
                      onChange={(e) => setEditForm({ ...editForm, returnAt: e.target.value })}
                    />
                  </Field>
                  <ReturnTripFields
                    value={editForm.returnTrip}
                    onChange={(returnTrip) => setEditForm({ ...editForm, returnTrip })}
                    outboundPickupCity={editForm.pickupCity}
                    outboundPickupLocation={editForm.pickupLocation}
                    outboundDestinationCity={editForm.destinationCity}
                    outboundDestinationLocation={editForm.destinationLocation}
                    outboundStops={editForm.stops}
                  />
                </>
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

              {editError ? <p className="text-[13.5px] text-[#7F1D1D]">{editError}</p> : null}

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

        <div className="mt-4 space-y-2 border-t border-[var(--border-soft)] pt-4">
          {!reassigning ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {vehicle ? (
                  <AssignmentChip>
                    <VehicleAvatar type={vehicle.type} photoUrl={vehicle.photos[0] ?? null} size="sm" />
                    {tType(vehicle.type)} {vehicle.model}
                  </AssignmentChip>
                ) : (
                  <EmptyAssignmentChip>{t("carrier.assignment.noVehicleAssigned")}</EmptyAssignmentChip>
                )}
                {driver ? (
                  <AssignmentChip>
                    <DriverAvatar name={driver.name} size="sm" />
                    {driver.name}
                  </AssignmentChip>
                ) : (
                  <EmptyAssignmentChip>{t("carrier.assignment.noDriverAssigned")}</EmptyAssignmentChip>
                )}
              </div>
              <Button type="button" variant="secondary" onClick={() => setReassigning(true)}>
                {t("carrier.calendar.reassign")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-[10px] sm:grid-cols-2">
                <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {tType(v.type)} {v.model}
                    </option>
                  ))}
                </Select>
                <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
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
          <p className="mt-4 text-[20px] font-bold tracking-[-0.015em] text-[var(--ink-primary)]">
            {Number(ride.price).toLocaleString()} {ride.currency}
          </p>
        ) : null}

        {error ? <p className="mt-2 text-[13.5px] text-[#7F1D1D]">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-soft)] pt-4">
          {ride.status !== "CANCELLED" && ride.status !== "COMPLETED" ? (
            <Button type="button" variant="danger" disabled={busy === "cancel"} onClick={cancelRide}>
              {busy === "cancel" ? t("common.loading") : t("carrier.calendar.cancelRide")}
            </Button>
          ) : null}
        </div>

        <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.065em] text-[var(--ink-eyebrow)]">
            {t("documents.generateAll")}
          </h3>
          <DocumentDownloads bookingId={ride.id} initialDocuments={[]} />
        </div>
      </div>
    </SidePanel>
  );
}
