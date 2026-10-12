"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, X, CircleAlert, Bus, ArrowRight, ArrowLeft, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { SidePanel } from "@/components/ui/SidePanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { PlateChip } from "@/components/ui/PlateChip";
import { CityLocationFields } from "@/components/forms/CityLocationFields";
import { EMPTY_RETURN_TRIP, returnTripPayload, ReturnTripFields } from "@/components/forms/ReturnTripFields";
import { RideDocumentsSection } from "./RideDocumentsSection";
import { NewRideModal, type NewRideInitialValues } from "./NewRideModal";
import { RIDE_STATUS_ACCENT } from "./statusStyles";
import { RingMarker, PinMarker, DotConnector } from "./newRide/timelineMarkers";
import { fetchWithAvailabilityConfirm } from "@/lib/availabilityConfirm";
import { clientDisplayName } from "@/lib/clientDisplay";
import { formatPhone } from "@/lib/phoneDisplay";
import { displayRideStatus } from "@/lib/rideStatus";
import { formatTime24 } from "@/lib/rideDateFormat";
import { formatPickerDate } from "@/lib/pickerDateFormat";
import { resolveReturnLeg } from "@/lib/rideReturnLeg";
import type { CityLocation } from "@/lib/location";
import type { CalendarDriver, CalendarRide, CalendarVehicle } from "./types";

const AVERAGE_TRIP_DURATION_MS = 4 * 60 * 60 * 1000;

const SECONDARY_BTN_CLASS =
  "flex h-8 shrink-0 items-center whitespace-nowrap rounded-[8px] border border-[var(--border-control)] px-3 text-[13.5px] font-medium text-[var(--ink-primary)] transition-colors duration-[.12s] ease-out hover:bg-[#FAFAFA]";
const PRIMARY_SM_BTN_CLASS =
  "flex h-8 shrink-0 items-center whitespace-nowrap rounded-[8px] bg-[var(--action-bg)] px-3 text-[13.5px] font-medium text-white transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)]";
// Footer actions (§3): a muted ghost text button for a destructive-but-
// reversible-via-confirm action (Cancel ride / Remove from calendar) — no
// border/background at rest, only turning danger-red on hover/focus.
const FOOTER_GHOST_DANGER_BTN_CLASS =
  "flex h-10 shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[8px] px-[10px] text-[14px] font-medium text-[var(--ink-muted)] transition-colors duration-[.12s] ease-out hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:bg-[#FEF2F2] focus-visible:text-[#DC2626] focus-visible:outline-none disabled:opacity-50";
// Footer secondary action (Duplicate) — white bg, bordered, 40px, matching
// Cancel/Remove's height so the row's buttons align.
const FOOTER_SECONDARY_BTN_CLASS =
  "flex h-10 shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[8px] border border-[var(--border-control)] bg-white px-3 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-[.12s] ease-out hover:bg-[#FAFAFA]";

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

// A single stop row within a leg block (§2) — city/location only, no role
// word. `time` is set only on the first row (scheduled departure) and the
// last row (estimated arrival, muted); intermediate stops carry no time.
interface RouteLegRow {
  city: string;
  location: string;
  time: string | null;
  muted?: boolean;
}

interface RouteLeg {
  key: "outbound" | "return";
  label: string;
  date: Date;
  rows: RouteLegRow[];
  // True only when the return leg's stops are exactly the outbound leg's
  // stops in reverse order (same city + location at each matching
  // position) — shown as a note instead of repeating an identical stop
  // list. A return with fewer/different/no stops describes a genuinely
  // different route, even with no custom pickup/destination override, so
  // it isn't flagged here — the stop rows below already say what it is.
  sameRouteReversed?: boolean;
}

function stopsAreReverseOf(outboundStops: CityLocation[], returnStops: CityLocation[]): boolean {
  if (outboundStops.length !== returnStops.length) return false;
  return outboundStops.every((stop, i) => {
    const mirrored = returnStops[returnStops.length - 1 - i];
    return mirrored.city === stop.city && mirrored.location === stop.location;
  });
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
  const locale = useLocale();

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
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

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

    // See the same guard (and the reasoning) in NewRideModal — an older,
    // slower-to-resolve request can still land after a newer one and
    // overwrite its correct result with a stale/wrong number.
    let cancelled = false;
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
      if (cancelled) return;
      setCalculatingDistance(false);
      if (!res?.ok) {
        setDistanceError(true);
        return;
      }
      const body = await res.json().catch(() => null);
      if (cancelled) return;
      if (typeof body?.distanceKm === "number") setEditDistanceKm(body.distanceKm);
      else setDistanceError(true);
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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

  const blocking = ride.status === "PENDING" && (!ride.vehicleId || !ride.driverId);
  const blockingText = !ride.vehicleId ? tDetail("vehicleMissing") : t("carrier.assignment.noDriverAssigned");

  // A confirmed ride whose trip window has already passed but was never
  // explicitly closed out — rather than force a "mark completed" step, the
  // carrier can just remove it, since at this point it either happened (and
  // needs no further action) or never did (and shouldn't linger).
  const canRemoveFromCalendar = ride.status === "CONFIRMED" && now >= departure;
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

  // Per-leg route blocks for the view-mode Ruta section (§1-§2): each leg
  // is its own date-separator-chip header + stop list, departure time on
  // the first row and estimated arrival (reusing the same
  // AVERAGE_TRIP_DURATION_MS convention as the outbound leg) on the last.
  const estimatedArrival = new Date(departure.getTime() + AVERAGE_TRIP_DURATION_MS);
  const outboundLeg: RouteLeg = {
    key: "outbound",
    label: tDetail("outboundLabel"),
    date: departure,
    rows: [
      { city: ride.pickupCity, location: ride.pickupLocation, time: formatTime24(departure) },
      ...ride.stops.map((s) => ({ city: s.city, location: s.location, time: null })),
      {
        city: ride.destinationCity,
        location: ride.destinationLocation,
        time: `~${formatTime24(estimatedArrival)}`,
        muted: true,
      },
    ],
  };

  const legs: RouteLeg[] = [outboundLeg];
  if (resolvedReturn) {
    const returnEstimatedArrival = returnAt ? new Date(returnAt.getTime() + AVERAGE_TRIP_DURATION_MS) : null;
    const sameRouteReversed =
      !ride.returnPickupCity && !ride.returnDestinationCity && stopsAreReverseOf(ride.stops, resolvedReturn.stops);
    legs.push({
      key: "return",
      label: tDetail("returnLabel"),
      date: returnAt ?? departure,
      sameRouteReversed,
      rows: [
        {
          city: resolvedReturn.pickupCity,
          location: resolvedReturn.pickupLocation,
          time: returnAt ? formatTime24(returnAt) : null,
        },
        ...resolvedReturn.stops.map((s) => ({ city: s.city, location: s.location, time: null })),
        {
          city: resolvedReturn.destinationCity,
          location: resolvedReturn.destinationLocation,
          time: returnEstimatedArrival ? `~${formatTime24(returnEstimatedArrival)}` : null,
          muted: true,
        },
      ],
    });
  }

  const totalKm = ride.estimatedDistanceKm ?? null;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayCount = returnAt ? Math.round((startOfDay(returnAt).getTime() - startOfDay(departure).getTime()) / DAY_MS) + 1 : null;
  const multiDay = dayCount !== null && dayCount > 1;

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
    setConfirmingCancel(false);
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

  async function removeFromCalendar() {
    setConfirmingRemove(false);
    setBusy("remove");
    setError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      setError(t("common.saveFailed"));
      return;
    }
    onChanged();
    onClose();
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
            {blocking ? (
              <>
                <span className="text-[#D4D4D8]">·</span>
                <span className="flex items-center gap-[4px] text-[#DC2626]">
                  <CircleAlert size={14} strokeWidth={1.9} />
                  {blockingText}
                </span>
              </>
            ) : null}
            {totalKm !== null ? (
              <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2 py-[3px] text-[12px] font-medium tabular-nums text-[#3F3F46]">
                {Math.round(totalKm)} km
              </span>
            ) : null}
            {multiDay ? (
              <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2 py-[3px] text-[12px] font-medium tabular-nums text-[#3F3F46]">
                {tDetail("daysChip", { days: dayCount })}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-[var(--border-hairline)] px-6 py-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="text-[13.5px] font-semibold text-[var(--ink-primary)]">{tDetail("trip")}</h3>
              {!editable ? null : !editingDistanceOnly ? (
                <button
                  type="button"
                  onClick={() => {
                    setDistanceOverrideInput(ride.estimatedDistanceKm ? String(Math.round(ride.estimatedDistanceKm)) : "");
                    setEditingDistanceOnly(true);
                  }}
                  className="text-[12.5px] text-[#71717A] underline-offset-2 hover:text-[var(--ink-secondary)] hover:underline"
                >
                  {totalKm !== null ? tDetail("editDistance") : tDetail("addDistance")}
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
              <div className="flex flex-col gap-5">
                {legs.map((leg) => (
                  <div key={leg.key}>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className="inline-flex h-[26px] shrink-0 items-center gap-[6px] whitespace-nowrap rounded-full bg-[#F4F4F5] text-[12.5px] font-medium tabular-nums text-[#27272B]"
                        style={{ padding: "0 10px 0 8px" }}
                      >
                        {leg.key === "outbound" ? (
                          <ArrowRight size={14} strokeWidth={2} color="#3F3F46" />
                        ) : (
                          <ArrowLeft size={14} strokeWidth={2} color="#3F3F46" />
                        )}
                        {leg.label} · {formatPickerDate(leg.date, locale)}
                      </span>
                      <span className="h-px flex-1 bg-[#F0F0F2]" />
                    </div>
                    {leg.sameRouteReversed ? (
                      <p className="mt-[6px] text-[12.5px] text-[#A1A1AA]">{tDetail("sameRouteReversed")}</p>
                    ) : null}
                    <div className="mt-[12px] flex flex-col gap-[2px]">
                      {leg.rows.map((row, i) => (
                        <Fragment key={i}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-4 shrink-0 items-center justify-center">
                              {i === leg.rows.length - 1 ? <PinMarker /> : <RingMarker />}
                            </div>
                            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-medium leading-5 text-[#18181B]">{row.city}</p>
                                {row.location ? (
                                  <p className="truncate text-[13px] text-[#71717A]">{row.location}</p>
                                ) : null}
                              </div>
                              {row.time ? (
                                <span
                                  className={`shrink-0 pt-[1px] text-[13px] tabular-nums ${
                                    row.muted ? "text-[#A1A1AA]" : "text-[#3F3F46]"
                                  }`}
                                >
                                  {row.time}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {i < leg.rows.length - 1 ? (
                            <div className="flex items-center gap-3">
                              <div className="flex w-4 shrink-0 items-center justify-center">
                                <DotConnector />
                              </div>
                              <div />
                            </div>
                          ) : null}
                        </Fragment>
                      ))}
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
                      <p className="flex items-center gap-[6px] truncate text-[13px] text-[var(--ink-secondary)]">
                        {vehicle.licensePlate ? <PlateChip plate={vehicle.licensePlate} /> : "—"}
                        {`· ${vehicle.seats} ${t("carrier.fleetTable.seats")}`}
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
                    <DriverAvatar driver={driver} size={32} decorative />
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
                    <DriverAvatar driver={null} size={32} />
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

              <span className="text-[var(--ink-secondary)]">{tDetail("distanceLabel")}</span>
              <span className="font-medium tabular-nums text-[var(--ink-primary)]">
                {totalKm !== null ? `${Math.round(totalKm)} km` : "—"}
              </span>

              <span className="text-[var(--ink-secondary)]">{tDetail("price")}</span>
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {ride.price !== null ? `${Number(ride.price).toLocaleString()} ${ride.currency}` : "—"}
              </span>
            </div>
          </div>

          {vehicle && driver && ride.price !== null ? (
            <RideDocumentsSection rideId={ride.id} clientEmail={ride.client.email} />
          ) : null}

          {error ? <p className="border-b border-[var(--border-hairline)] px-6 py-3 text-[13.5px] text-[#DC2626]">{error}</p> : null}
        </div>

        <div className="mt-auto flex h-16 shrink-0 items-center justify-between border-t border-[var(--border-hairline)] px-6">
          <div className="flex items-center gap-2">
            {cancellable ? (
              <button type="button" onClick={() => setConfirmingCancel(true)} className={FOOTER_GHOST_DANGER_BTN_CLASS}>
                <X size={16} strokeWidth={1.9} />
                {t("carrier.calendar.cancelRide")}
              </button>
            ) : null}
            {canRemoveFromCalendar ? (
              <button type="button" onClick={() => setConfirmingRemove(true)} className={FOOTER_GHOST_DANGER_BTN_CLASS}>
                <Trash2 size={16} strokeWidth={1.9} />
                {tDetail("removeFromCalendar")}
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDuplicating(true)}
              aria-label={tDetail("duplicate")}
              title={tDetail("duplicate")}
              className={FOOTER_SECONDARY_BTN_CLASS}
            >
              <Copy size={16} strokeWidth={1.9} />
              <span className="hidden sm:inline">{tDetail("duplicate")}</span>
            </button>
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
          </div>
        </div>
      </SidePanel>

      {confirmingCancel ? (
        <ConfirmDialog
          title={t("carrier.calendar.cancelConfirmTitle")}
          body={t("carrier.calendar.cancelConfirmBody")}
          cancelLabel={t("common.back")}
          confirmLabel={t("carrier.calendar.cancelRide")}
          confirming={busy === "cancel"}
          onCancel={() => setConfirmingCancel(false)}
          onConfirm={cancelRide}
        />
      ) : null}

      {confirmingRemove ? (
        <ConfirmDialog
          title={t("carrier.calendar.removeConfirmTitle")}
          body={t("carrier.calendar.removeConfirmBody")}
          cancelLabel={t("common.back")}
          confirmLabel={tDetail("removeFromCalendar")}
          confirming={busy === "remove"}
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={removeFromCalendar}
        />
      ) : null}

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
