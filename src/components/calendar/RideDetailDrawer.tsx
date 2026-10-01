"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, X, Ellipsis, CircleAlert, Bus, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { SidePanel } from "@/components/ui/SidePanel";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { EMPTY_RETURN_TRIP, returnTripPayload, ReturnTripFields } from "@/components/forms/ReturnTripFields";
import { RideDocumentsSection } from "./RideDocumentsSection";
import { NewRideModal, type NewRideInitialValues } from "./NewRideModal";
import { RIDE_STATUS_ACCENT } from "./statusStyles";
import { fetchWithAvailabilityConfirm } from "@/lib/availabilityConfirm";
import { clientDisplayName } from "@/lib/clientDisplay";
import { displayRideStatus } from "@/lib/rideStatus";
import { formatShortDate, formatTime24 } from "@/lib/rideDateFormat";
import { resolveReturnLeg } from "@/lib/rideReturnLeg";
import type { CityLocation } from "@/lib/location";
import type { CalendarDriver, CalendarRide, CalendarVehicle } from "./types";

const AVERAGE_TRIP_DURATION_MS = 4 * 60 * 60 * 1000;

const SECONDARY_BTN_CLASS =
  "flex h-8 shrink-0 items-center whitespace-nowrap rounded-[8px] border border-[var(--border-control)] px-3 text-[13.5px] font-medium text-[var(--ink-primary)] transition-colors duration-[.12s] ease-out hover:bg-[#FAFAFA]";
const PRIMARY_SM_BTN_CLASS =
  "flex h-8 shrink-0 items-center whitespace-nowrap rounded-[8px] bg-[var(--action-bg)] px-3 text-[13.5px] font-medium text-white transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)]";

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Lightweight, universal grouping (not a real phone-number library) — keeps
// a leading "+" attached and groups the rest in 3s, e.g.
// "+381641234567" -> "+381 641 234 567".
function formatPhone(phone: string): string {
  const hasPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  const groups = digits.match(/.{1,3}/g) ?? [digits];
  return (hasPlus ? "+" : "") + groups.join(" ");
}

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

interface TimelineEntry {
  kind: "origin" | "stop" | "destination" | "return";
  city: string;
  location: string;
  label: string;
  date?: Date;
  // The destination has no stored arrival timestamp (only departure/return
  // are real fields) — its date is a rough estimate, flagged so the UI can
  // mark it as such rather than presenting it as a hard fact.
  estimated?: boolean;
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
  const tDetail = useTranslations("carrier.calendar.detail");

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [changingField, setChangingField] = useState<"vehicle" | "driver" | null>(null);
  const [pendingValue, setPendingValue] = useState("");
  const [freeCount, setFreeCount] = useState<{ vehicles: number; drivers: number } | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(() => buildEditForm(ride));
  const [editError, setEditError] = useState<string | null>(null);
  const [editDistanceKm, setEditDistanceKm] = useState<number | null>(ride.estimatedDistanceKm ?? null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState(false);

  const [duplicating, setDuplicating] = useState(false);

  // Quick standalone override for the Trip section's computed total — lets
  // a carrier who disagrees with the maps estimate correct it on its own,
  // without opening the full "Edit ride" trip-detail form.
  const [editingDistanceOnly, setEditingDistanceOnly] = useState(false);
  const [distanceOverrideInput, setDistanceOverrideInput] = useState("");
  const [savingDistanceOverride, setSavingDistanceOverride] = useState(false);

  // Live distance preview while editing trip details — recalculates as
  // pickup/destination/stops (and, for a round trip, the return leg)
  // change, same pattern as NewRideModal/CarrierRideForm. Seeded from the
  // ride's already-stored estimate, not recalculated until something
  // actually changes.
  useEffect(() => {
    if (!editing) return;
    const { pickupCity, pickupLocation, destinationCity, destinationLocation, stops, isRoundTrip, returnTrip } = editForm;
    // Only the city is required to attempt a distance estimate — see the
    // same comment in NewRideModal.
    if (!pickupCity || !destinationCity) return;
    if (stops.some((s) => !s.city)) return;
    if (isRoundTrip && returnTrip.returnStops.some((s) => !s.city)) return;

    const timer = setTimeout(async () => {
      setCalculatingDistance(true);
      setDistanceError(false);
      const res = await fetch("/api/carrier/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCity,
          pickupLocation,
          destinationCity,
          destinationLocation,
          stops,
          isRoundTrip,
          ...returnTripPayload(isRoundTrip, returnTrip),
        }),
      }).catch(() => null);
      setCalculatingDistance(false);
      if (!res?.ok) {
        setDistanceError(true);
        return;
      }
      const body = await res.json().catch(() => null);
      if (typeof body?.distanceKm === "number") setEditDistanceKm(body.distanceKm);
      else setDistanceError(true);
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editing,
    editForm.pickupCity,
    editForm.pickupLocation,
    editForm.destinationCity,
    editForm.destinationLocation,
    editForm.stops,
    editForm.isRoundTrip,
    editForm.returnTrip,
  ]);

  // Trip details freeze, and Cancel disappears, once a ride is cancelled
  // or has effectively completed (past its date) — including the
  // date-based inference, not just an explicit "Mark completed". A ride
  // that already happened isn't something to cancel.
  const status = displayRideStatus(ride);
  const editable = status !== "CANCELLED" && status !== "COMPLETED";
  const cancellable = editable;

  const vehicle = vehicles.find((v) => v.id === ride.vehicleId);
  const driver = drivers.find((d) => d.id === ride.driverId);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (ride.vehicleId && ride.driverId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFreeCount(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ departureAt: ride.departureAt });
    if (ride.isRoundTrip && ride.returnAt) params.set("returnAt", ride.returnAt);
    fetch(`/api/carrier/availability/resources?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFreeCount({ vehicles: data.vehicles.length, drivers: data.drivers.length });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ride.id, ride.vehicleId, ride.driverId, ride.departureAt, ride.returnAt, ride.isRoundTrip]);

  const now = new Date();
  const departure = new Date(ride.departureAt);
  const returnAt = ride.returnAt ? new Date(ride.returnAt) : null;
  const effectiveEnd = returnAt ?? new Date(departure.getTime() + AVERAGE_TRIP_DURATION_MS);

  const blocking = ride.status === "PENDING" && (!ride.vehicleId || !ride.driverId);
  const blockingText = !ride.vehicleId ? tDetail("vehicleMissing") : t("carrier.assignment.noDriverAssigned");
  const inProgress = ride.status === "CONFIRMED" && now >= departure && now < effectiveEnd;
  const progressText = inProgress
    ? `${tDetail("inProgress")}${
        returnAt
          ? " · " +
            (isSameCalendarDay(returnAt, now)
              ? tDetail("returnsToday", { time: formatTime24(returnAt) })
              : tDetail("returnsOn", { date: formatShortDate(returnAt), time: formatTime24(returnAt) }))
          : ""
      }`
    : null;

  const canMarkCompleted = ride.status === "CONFIRMED" && now >= departure;
  const overCapacity = Boolean(vehicle) && ride.passengerCount > vehicle!.seats;

  const resolvedReturn = ride.isRoundTrip
    ? resolveReturnLeg(
        {
          pickupCity: ride.pickupCity,
          pickupLocation: ride.pickupLocation,
          destinationCity: ride.destinationCity,
          destinationLocation: ride.destinationLocation,
          stops: ride.stops,
        },
        {
          returnPickupCity: ride.returnPickupCity ?? undefined,
          returnPickupLocation: ride.returnPickupLocation ?? undefined,
          returnDestinationCity: ride.returnDestinationCity ?? undefined,
          returnDestinationLocation: ride.returnDestinationLocation ?? undefined,
          returnStops: ride.returnStops,
        },
      )
    : null;

  const routeTitle = `${ride.pickupCity} → ${ride.destinationCity}${
    resolvedReturn ? ` → ${resolvedReturn.destinationCity}` : ""
  }`;

  const timeline: TimelineEntry[] = [
    { kind: "origin", city: ride.pickupCity, location: ride.pickupLocation, label: tDetail("pickup"), date: departure },
    ...ride.stops.map((s, i) => ({
      kind: "stop" as const,
      city: s.city,
      location: s.location,
      label: `${t("client.requestForm.stop")} ${i + 1}`,
    })),
    {
      kind: "destination",
      city: ride.destinationCity,
      location: ride.destinationLocation,
      label: tDetail("destination"),
      date: new Date(departure.getTime() + AVERAGE_TRIP_DURATION_MS),
      estimated: true,
    },
  ];
  if (resolvedReturn) {
    resolvedReturn.stops.forEach((s, i) => {
      timeline.push({
        kind: "stop",
        city: s.city,
        location: s.location,
        label: `${t("client.requestForm.stop")} ${i + 1}`,
      });
    });
    timeline.push({
      kind: "return",
      city: resolvedReturn.destinationCity,
      location: resolvedReturn.destinationLocation,
      label: tDetail("returnLabel"),
      date: returnAt ?? undefined,
    });
  }

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
        distanceKm: editDistanceKm ?? undefined,
      },
      (start, end) => t("carrier.calendar.availabilityWarning", { start, end }),
    );
    setBusy(null);
    if (!res.ok) {
      if (!declinedAvailability) setEditError(t("common.saveFailed"));
      return;
    }
    setEditing(false);
    onChanged();
  }

  function startChanging(field: "vehicle" | "driver") {
    setChangingField(field);
    setPendingValue(field === "vehicle" ? ride.vehicleId ?? "" : ride.driverId ?? "");
    setError(null);
  }

  async function saveAssignment() {
    if (!changingField) return;
    setBusy(changingField);
    setError(null);
    const body = changingField === "vehicle" ? { vehicleId: pendingValue } : { driverId: pendingValue };
    const { response: res, declinedAvailability } = await fetchWithAvailabilityConfirm(
      `/api/carrier/rides/${ride.id}/assign`,
      "POST",
      body,
      (start, end) => t("carrier.calendar.availabilityWarning", { start, end }),
    );
    setBusy(null);
    if (!res.ok) {
      if (!declinedAvailability) setError(t("common.saveFailed"));
      return;
    }
    setChangingField(null);
    onChanged();
  }

  async function saveDistanceOverride() {
    const km = Number(distanceOverrideInput);
    if (!km || km <= 0) return;
    setSavingDistanceOverride(true);
    setError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}/distance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ distanceKm: km }),
    });
    setSavingDistanceOverride(false);
    if (!res.ok) {
      setError(t("common.saveFailed"));
      return;
    }
    setEditingDistanceOnly(false);
    onChanged();
  }

  async function cancelRide() {
    if (!confirm(t("carrier.calendar.cancelConfirm"))) return;
    setMenuOpen(false);
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

  async function markCompleted() {
    setBusy("complete");
    setError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}/complete`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      setError(t("common.saveFailed"));
      return;
    }
    onChanged();
  }

  function copyLink() {
    try {
      const locale = window.location.pathname.split("/")[1] || "en";
      const url = `${window.location.origin}/${locale}/carrier/bookings?scope=all&edit=${ride.id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } catch {
      // Clipboard unavailable — silently no-op rather than error out a
      // secondary, non-critical action.
    }
  }

  const duplicateInitialValues: NewRideInitialValues = {
    clientCompanyName: ride.client.companyName ?? "",
    clientName: ride.client.name ?? "",
    clientPhone: ride.client.phone ?? "",
    pickupCity: ride.pickupCity,
    pickupLocation: ride.pickupLocation,
    destinationCity: ride.destinationCity,
    destinationLocation: ride.destinationLocation,
    stops: ride.stops,
    passengerCount: String(ride.passengerCount),
    specialRequests: ride.specialRequests ?? "",
  };

  return (
    <>
      <SidePanel onClose={onClose}>
        <div className="shrink-0 border-b border-[var(--border-hairline)] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 truncate text-[19px] font-semibold tracking-[-0.015em] text-[var(--ink-primary)]">
              {routeTitle}
            </h2>
            <div className="flex shrink-0 items-center gap-1">
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={t("common.actions")}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
                >
                  <Ellipsis size={17} strokeWidth={1.9} />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-[60] mt-1 w-[180px] rounded-[12px] border border-[var(--border-hairline)] bg-white py-1 shadow-[var(--shadow-card)]">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDuplicating(true);
                      }}
                      className="flex h-9 w-full items-center gap-2 px-3 text-left text-[14px] text-[var(--ink-body)] hover:bg-[var(--border-soft)]"
                    >
                      <Copy size={15} strokeWidth={1.9} />
                      {tDetail("duplicate")}
                    </button>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex h-9 w-full items-center gap-2 px-3 text-left text-[14px] text-[var(--ink-body)] hover:bg-[var(--border-soft)]"
                    >
                      <Link2 size={15} strokeWidth={1.9} />
                      {copied ? tDetail("linkCopied") : tDetail("copyLink")}
                    </button>
                    {cancellable ? (
                      <button
                        type="button"
                        onClick={cancelRide}
                        className="flex h-9 w-full items-center gap-2 px-3 text-left text-[14px] text-[#DC2626] hover:bg-[var(--border-soft)]"
                      >
                        <X size={15} strokeWidth={1.9} />
                        {t("carrier.calendar.cancelRide")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
              >
                <X size={17} strokeWidth={1.9} />
              </button>
            </div>
          </div>

          <p className="mt-[3px] truncate text-[13px] text-[var(--ink-secondary)]">
            {clientDisplayName(ride.client)} · #{ride.id.slice(-6).toUpperCase()}
          </p>

          <div className="mt-2 flex items-center gap-[6px] text-[13.5px]">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: RIDE_STATUS_ACCENT[status] }} />
            <span className="text-[#27272B]">{t(`rideStatus.${status}`)}</span>
            {blocking || progressText ? (
              <>
                <span className="text-[#D4D4D8]">·</span>
                {blocking ? (
                  <span className="flex items-center gap-[4px] text-[#DC2626]">
                    <CircleAlert size={14} strokeWidth={1.9} />
                    {blockingText}
                  </span>
                ) : (
                  <span className="text-[var(--ink-secondary)]">{progressText}</span>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-[var(--border-hairline)] px-6 py-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">{tDetail("trip")}</h3>
              {!editable ? (
                ride.estimatedDistanceKm ? (
                  <span className="text-[13px] text-[var(--ink-muted)]">
                    {tDetail("tripTotal", { km: Math.round(ride.estimatedDistanceKm) })}
                  </span>
                ) : null
              ) : !editingDistanceOnly ? (
                <button
                  type="button"
                  onClick={() => {
                    setDistanceOverrideInput(ride.estimatedDistanceKm ? String(Math.round(ride.estimatedDistanceKm)) : "");
                    setEditingDistanceOnly(true);
                  }}
                  className="text-[13px] text-[var(--ink-muted)] underline-offset-2 hover:text-[var(--ink-secondary)] hover:underline"
                >
                  {ride.estimatedDistanceKm
                    ? tDetail("tripTotal", { km: Math.round(ride.estimatedDistanceKm) })
                    : tDetail("addDistance")}
                </button>
              ) : (
                <div className="flex items-center gap-[6px]">
                  <input
                    type="number"
                    min={1}
                    step="0.1"
                    autoFocus
                    value={distanceOverrideInput}
                    onChange={(e) => setDistanceOverrideInput(e.target.value)}
                    className="h-7 w-20 rounded-[6px] border border-[var(--border-control)] px-2 text-[13px] text-[var(--ink-primary)] focus:outline-none focus:border-[#2563EB]"
                  />
                  <span className="text-[13px] text-[var(--ink-muted)]">km</span>
                  <button
                    type="button"
                    onClick={saveDistanceOverride}
                    disabled={savingDistanceOverride}
                    className="text-[13px] font-medium text-[var(--action-bg)] hover:underline disabled:opacity-50"
                  >
                    {savingDistanceOverride ? t("common.loading") : t("common.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDistanceOnly(false)}
                    className="text-[13px] text-[var(--ink-muted)] hover:underline"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              )}
            </div>
            {!editing ? (
              <div className="flex flex-col">
                {timeline.map((entry, i) => (
                  <div key={i} className="grid items-start gap-x-3" style={{ gridTemplateColumns: "16px 1fr auto" }}>
                    <div className="flex flex-col items-center">
                      {entry.kind === "origin" || entry.kind === "return" ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#18181B]" />
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-[var(--border-strong)] bg-white" />
                      )}
                      {i < timeline.length - 1 ? (
                        <span className="mt-[3px] w-px flex-1 bg-[var(--border-control)]" />
                      ) : null}
                    </div>
                    <div className="min-w-0 pb-5">
                      <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{entry.city}</p>
                      <p className="truncate text-[13px] text-[var(--ink-secondary)]">
                        {entry.kind === "return" ? entry.label : `${entry.label} · ${entry.location}`}
                      </p>
                    </div>
                    <div className="pb-5 text-right">
                      {entry.date ? (
                        <>
                          <p className="whitespace-nowrap text-[14px] font-medium tabular-nums text-[var(--ink-primary)]">
                            {formatShortDate(entry.date)}
                          </p>
                          <p className="whitespace-nowrap text-[13px] tabular-nums text-[var(--ink-secondary)]">
                            {formatTime24(entry.date)}
                            {entry.estimated ? (
                              <span className="ml-[3px] text-[var(--ink-muted)]">{tDetail("estimated")}</span>
                            ) : null}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
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
                      cityLabel={t("client.requestForm.stopCity")}
                      locationLabel={t("client.requestForm.stopAddress")}
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

                {calculatingDistance ? (
                  <p className="text-[13px] text-[var(--ink-muted)]">{t("carrier.rideForm.calculatingDistance")}</p>
                ) : editDistanceKm !== null ? (
                  <p className="text-[13px] text-[var(--ink-muted)]">
                    {t("carrier.rideForm.estimatedDistance", { km: Math.round(editDistanceKm) })}
                  </p>
                ) : distanceError ? (
                  <p className="text-[13px] text-[#DC2626]">{t("carrier.rideForm.distanceUnavailableShort")}</p>
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

          <div className="border-b border-[var(--border-hairline)] px-6 py-5">
            <h3 className="mb-3 text-[14px] font-semibold text-[var(--ink-primary)]">{tDetail("assignmentSection")}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex min-h-[44px] items-center gap-3">
                {vehicle ? (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--border-soft)]">
                      <Bus size={19} strokeWidth={1.9} color="#3F3F46" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
                        {tType(vehicle.type)} {vehicle.model}
                      </p>
                      <p className="truncate text-[13px] text-[var(--ink-secondary)]">
                        {vehicle.licensePlate ? (
                          <span className="font-mono uppercase">{vehicle.licensePlate}</span>
                        ) : (
                          "—"
                        )}
                        {` · ${vehicle.seats} ${t("carrier.fleetTable.seats")}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => startChanging("vehicle")} className={SECONDARY_BTN_CLASS}>
                      {tDetail("change")}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--border-strong)]">
                      <Bus size={17} strokeWidth={1.9} color="var(--ink-disabled)" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[var(--ink-secondary)]">{tDetail("noVehicle")}</p>
                      <p className="truncate text-[13px] text-[var(--ink-muted)]">
                        {freeCount ? tDetail("vehiclesFree", { count: freeCount.vehicles }) : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => startChanging("vehicle")} className={PRIMARY_SM_BTN_CLASS}>
                      {tDetail("assignVehicle")}
                    </button>
                  </>
                )}
              </div>

              {changingField === "vehicle" ? (
                <div className="flex items-center gap-2 pl-12">
                  <Select value={pendingValue} onChange={(e) => setPendingValue(e.target.value)}>
                    <option value="">—</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {tType(v.type)} {v.model}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" compact disabled={busy === "vehicle"} onClick={saveAssignment}>
                    {busy === "vehicle" ? t("common.loading") : t("common.save")}
                  </Button>
                  <Button type="button" variant="ghost" compact onClick={() => setChangingField(null)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : null}

              <div className="flex min-h-[44px] items-center gap-3">
                {driver ? (
                  <>
                    <DriverAvatar id={driver.id} name={driver.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{driver.name}</p>
                      <p className="truncate text-[13px] text-[var(--ink-secondary)]">{driver.phone || "—"}</p>
                    </div>
                    <button type="button" onClick={() => startChanging("driver")} className={SECONDARY_BTN_CLASS}>
                      {tDetail("change")}
                    </button>
                  </>
                ) : (
                  <>
                    <DriverAvatar empty size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[var(--ink-secondary)]">{tDetail("noDriver")}</p>
                      <p className="truncate text-[13px] text-[var(--ink-muted)]">
                        {freeCount ? tDetail("driversFree", { count: freeCount.drivers }) : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => startChanging("driver")} className={PRIMARY_SM_BTN_CLASS}>
                      {tDetail("assignDriver")}
                    </button>
                  </>
                )}
              </div>

              {changingField === "driver" ? (
                <div className="flex items-center gap-2 pl-12">
                  <Select value={pendingValue} onChange={(e) => setPendingValue(e.target.value)}>
                    <option value="">—</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" compact disabled={busy === "driver"} onClick={saveAssignment}>
                    {busy === "driver" ? t("common.loading") : t("common.save")}
                  </Button>
                  <Button type="button" variant="ghost" compact onClick={() => setChangingField(null)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-b border-[var(--border-hairline)] px-6 py-5">
            <h3 className="mb-3 text-[14px] font-semibold text-[var(--ink-primary)]">{tDetail("detailsSection")}</h3>
            <div className="grid gap-y-[10px] text-[14px]" style={{ gridTemplateColumns: "120px 1fr" }}>
              <span className="text-[var(--ink-secondary)]">{tDetail("passengers")}</span>
              <span className={`font-medium ${overCapacity ? "text-[#DC2626]" : "text-[var(--ink-primary)]"}`}>
                {ride.passengerCount}
                {vehicle ? <span className="text-[var(--ink-muted)]">/{vehicle.seats}</span> : null}
              </span>

              <span className="text-[var(--ink-secondary)]">{t("common.phone")}</span>
              <span className="font-medium text-[var(--ink-primary)]">
                {ride.client.phone ? formatPhone(ride.client.phone) : "—"}
              </span>

              <span className="text-[var(--ink-secondary)]">{tDetail("price")}</span>
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {ride.price !== null ? `${Number(ride.price).toLocaleString()} ${ride.currency}` : "—"}
              </span>
            </div>
          </div>

          {vehicle && driver && ride.price !== null ? <RideDocumentsSection rideId={ride.id} /> : null}

          {error ? <p className="border-b border-[var(--border-hairline)] px-6 py-3 text-[13.5px] text-[#DC2626]">{error}</p> : null}
        </div>

        <div className="mt-auto flex h-16 shrink-0 items-center justify-between border-t border-[var(--border-hairline)] px-6">
          <div>
            {cancellable ? (
              <button
                type="button"
                onClick={cancelRide}
                disabled={busy === "cancel"}
                className="text-[13.5px] font-medium text-[#DC2626] transition-opacity hover:underline disabled:opacity-50"
              >
                {busy === "cancel" ? t("common.loading") : t("carrier.calendar.cancelRide")}
              </button>
            ) : (
              <span />
            )}
          </div>
          <div className="flex items-center gap-2">
            {editable && !editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditForm(buildEditForm(ride));
                  setEditError(null);
                  setEditDistanceKm(ride.estimatedDistanceKm ?? null);
                  setEditing(true);
                }}
                className="flex h-9 items-center gap-[6px] rounded-[9px] border border-[var(--border-control)] px-3 text-[13.5px] font-medium text-[var(--ink-primary)] transition-colors duration-[.12s] ease-out hover:bg-[#FAFAFA]"
              >
                <Pencil size={15} strokeWidth={1.9} />
                {tDetail("editRide")}
              </button>
            ) : null}
            {canMarkCompleted ? (
              <button
                type="button"
                onClick={markCompleted}
                disabled={busy === "complete"}
                className="flex h-9 items-center rounded-[9px] bg-[var(--action-bg)] px-3 text-[13.5px] font-medium text-white transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)] disabled:opacity-50"
              >
                {busy === "complete" ? t("common.loading") : tDetail("markCompleted")}
              </button>
            ) : null}
          </div>
        </div>
      </SidePanel>

      {duplicating ? (
        <NewRideModal
          initialValues={duplicateInitialValues}
          onClose={() => setDuplicating(false)}
          onCreated={() => {
            setDuplicating(false);
            onChanged();
          }}
        />
      ) : null}
    </>
  );
}
