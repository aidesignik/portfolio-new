"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

export interface PublicSearchDefaults {
  pickupAddress: string;
  destinationAddress: string;
  departureAt: string;
  isRoundTrip: boolean;
  returnAt: string;
  passengerCount: string;
  estimatedDistanceKm: string;
}

export function PublicSearchForm({ defaults }: { defaults: PublicSearchDefaults }) {
  const t = useTranslations("client.requestForm");
  const [pickupAddress, setPickupAddress] = useState(defaults.pickupAddress);
  const [destinationAddress, setDestinationAddress] = useState(defaults.destinationAddress);
  const [isRoundTrip, setIsRoundTrip] = useState(defaults.isRoundTrip);
  const [estimatedDistanceKm, setEstimatedDistanceKm] = useState(defaults.estimatedDistanceKm);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceNotice, setDistanceNotice] = useState<string | null>(null);

  async function onCalculateDistance() {
    if (!pickupAddress || !destinationAddress) return;
    setDistanceLoading(true);
    setDistanceNotice(null);

    const res = await fetch("/api/distance/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickupAddress, destinationAddress }),
    });

    setDistanceLoading(false);

    if (!res.ok) {
      setDistanceNotice(t("distanceNotFound"));
      return;
    }

    const { distanceKm } = await res.json();
    setEstimatedDistanceKm(String(distanceKm));
  }

  return (
    // Plain GET form: works without client JS, results render server-side
    // from the query string on this same page.
    <form method="get" className="space-y-4">
      <Field label={t("pickupAddress")}>
        <Input
          name="pickupAddress"
          required
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
        />
      </Field>
      <Field label={t("destinationAddress")}>
        <Input
          name="destinationAddress"
          required
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
        />
      </Field>
      <Field label={t("departureAt")}>
        <Input type="datetime-local" name="departureAt" required defaultValue={defaults.departureAt} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isRoundTrip"
          checked={isRoundTrip}
          onChange={(e) => setIsRoundTrip(e.target.checked)}
        />
        {t("isRoundTrip")}
      </label>

      {isRoundTrip ? (
        <Field label={t("returnAt")}>
          <Input type="datetime-local" name="returnAt" required defaultValue={defaults.returnAt} />
        </Field>
      ) : null}

      <Field label={t("passengerCount")}>
        <Input
          type="number"
          min={1}
          name="passengerCount"
          required
          defaultValue={defaults.passengerCount || "40"}
        />
      </Field>

      <Field label={t("estimatedDistanceKm")}>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            step="1"
            name="estimatedDistanceKm"
            placeholder={t("estimatedDistanceKmPlaceholder")}
            value={estimatedDistanceKm}
            onChange={(e) => setEstimatedDistanceKm(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={distanceLoading || !pickupAddress || !destinationAddress}
            onClick={onCalculateDistance}
          >
            {distanceLoading ? "…" : t("calculateDistance")}
          </Button>
        </div>
        {distanceNotice ? <p className="mt-1 text-xs text-amber-600">{distanceNotice}</p> : null}
      </Field>

      <Button type="submit" className="w-full">
        {t("search")}
      </Button>
    </form>
  );
}
