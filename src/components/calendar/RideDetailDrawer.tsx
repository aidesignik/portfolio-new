"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocumentDownloads } from "@/components/forms/DocumentDownloads";
import type { CalendarDriver, CalendarRide, CalendarVehicle } from "./types";

const STATUS_TONE: Record<CalendarRide["status"], "warning" | "positive" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "positive",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
};

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

  const vehicle = vehicles.find((v) => v.id === ride.vehicleId);
  const driver = drivers.find((d) => d.id === ride.driverId);

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

  async function act(action: "confirm" | "cancel") {
    if (action === "cancel" && !confirm(t("carrier.calendar.cancelConfirm"))) return;
    setBusy(action);
    setError(null);
    const res = await fetch(`/api/carrier/rides/${ride.id}/${action}`, { method: "POST" });
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
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-zinc-400 hover:text-zinc-700"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <Badge tone={STATUS_TONE[ride.status]}>{t(`rideStatus.${ride.status}`)}</Badge>

        <div className="mt-4 space-y-1 border-t border-zinc-200 pt-4 text-sm">
          <p className="text-zinc-900">{ride.client.name ?? "—"}</p>
          <p className="text-zinc-600">{ride.client.phone}</p>
          <p className="text-zinc-600">
            {ride.pickupLocation} → {ride.destinationLocation}
          </p>
          <p className="text-zinc-600">{ride.passengerCount} {t("carrier.calendar.pax")}</p>
          {ride.specialRequests ? <p className="text-zinc-700">{ride.specialRequests}</p> : null}
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
          {ride.status === "PENDING" ? (
            <Button type="button" disabled={busy === "confirm"} onClick={() => act("confirm")}>
              {busy === "confirm" ? t("common.loading") : t("carrier.calendar.markConfirmed")}
            </Button>
          ) : null}
          {ride.status !== "CANCELLED" && ride.status !== "COMPLETED" ? (
            <Button type="button" variant="danger" disabled={busy === "cancel"} onClick={() => act("cancel")}>
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
