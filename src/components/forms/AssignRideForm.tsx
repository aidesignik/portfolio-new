"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { fetchWithAvailabilityConfirm } from "@/lib/availabilityConfirm";
import { suggestPrice } from "@/lib/pricing";

type Vehicle = { id: string; type: string; model: string; seats: number };
type Driver = { id: string; name: string };

export function AssignRideForm({
  rideId,
  vehicles,
  drivers,
  carrierRates,
  initialDistanceKm,
}: {
  rideId: string;
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
  const [ratePerKm, setRatePerKm] = useState(carrierRates.ratePerKm ? String(carrierRates.ratePerKm) : "");
  const [fixedFee, setFixedFee] = useState(carrierRates.fixedFee ? String(carrierRates.fixedFee) : "");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggested = useMemo(() => {
    const km = Number(distanceKm);
    if (!km || km <= 0) return null;
    return suggestPrice(km, {
      ratePerKm: ratePerKm ? Number(ratePerKm) : carrierRates.ratePerKm,
      fixedFee: fixedFee ? Number(fixedFee) : carrierRates.fixedFee,
    });
  }, [distanceKm, ratePerKm, fixedFee, carrierRates]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { response: res, declinedAvailability } = await fetchWithAvailabilityConfirm(
      `/api/carrier/rides/${rideId}/assign`,
      "POST",
      {
        vehicleId,
        driverId,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        price: Number(price || suggested || 0) || undefined,
      },
      (start, end) => t("carrier.calendar.availabilityWarning", { start, end }),
    );

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (declinedAvailability) {
        // Not a real failure — no error, just stay on the form.
      } else if (body?.error === "ALREADY_CLAIMED") {
        setError(t("carrier.offerForm.alreadyClaimed"));
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("carrier.ratePerKm")}>
          <Input type="number" min={0} step="0.01" value={ratePerKm} onChange={(e) => setRatePerKm(e.target.value)} />
        </Field>
        <Field label={t("carrier.fixedFee")}>
          <Input type="number" min={0} step="0.01" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} />
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
          placeholder={suggested ? String(suggested) : undefined}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("carrier.offerForm.submit")}
      </Button>
    </form>
  );
}
