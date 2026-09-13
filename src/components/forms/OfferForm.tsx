"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { suggestPrice } from "@/lib/pricing";

type Vehicle = { id: string; type: string; model: string; seats: number };
type Driver = { id: string; name: string };

export function OfferForm({
  requestId,
  vehicles,
  drivers,
  carrierRates,
  initialDistanceKm,
}: {
  requestId: string;
  vehicles: Vehicle[];
  drivers: Driver[];
  carrierRates: { ratePerKm: number | null; fixedFee: number | null };
  initialDistanceKm?: number | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm ? String(initialDistanceKm) : "");
  const [finalPrice, setFinalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggested = useMemo(() => {
    const km = Number(distanceKm);
    if (!km || km <= 0) return null;
    return suggestPrice(km, carrierRates);
  }, [distanceKm, carrierRates]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/requests/${requestId}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        driverId,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        finalPrice: Number(finalPrice || suggested || 0),
        notes: notes || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body?.error === "UNAVAILABLE") {
        setError(t("carrier.offerForm.unavailable"));
      } else if (body?.error === "DISTANCE_UNAVAILABLE") {
        setError(t("carrier.offerForm.distanceUnavailable"));
      } else {
        setError(t("common.saveFailed"));
      }
      return;
    }

    router.push("/carrier/requests");
    router.refresh();
  }

  if (vehicles.length === 0 || drivers.length === 0) {
    return <p className="text-sm text-zinc-600">{t("carrier.noVehicles")} / {t("carrier.noDrivers")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("carrier.offerForm.vehicle")}>
          <select
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
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
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t("carrier.offerForm.distanceKm")}>
        <Input
          type="number"
          min={1}
          step="0.1"
          placeholder={initialDistanceKm ? undefined : t("carrier.rideForm.distanceKmPlaceholder")}
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
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
          value={finalPrice}
          onChange={(e) => setFinalPrice(e.target.value)}
        />
      </Field>

      <Field label={t("carrier.offerForm.notes")}>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("carrier.offerForm.submit")}
      </Button>
    </form>
  );
}
