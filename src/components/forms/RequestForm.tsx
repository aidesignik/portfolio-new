"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

export function RequestForm() {
  const t = useTranslations("client.requestForm");
  const router = useRouter();
  const [form, setForm] = useState({
    pickupAddress: "",
    destinationAddress: "",
    departureAt: "",
    isRoundTrip: false,
    returnAt: "",
    passengerCount: "40",
    estimatedDistanceKm: "",
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceNotice, setDistanceNotice] = useState<string | null>(null);

  async function onCalculateDistance() {
    if (!form.pickupAddress || !form.destinationAddress) return;
    setDistanceLoading(true);
    setDistanceNotice(null);

    const res = await fetch("/api/distance/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupAddress: form.pickupAddress,
        destinationAddress: form.destinationAddress,
      }),
    });

    setDistanceLoading(false);

    if (!res.ok) {
      setDistanceNotice(t("distanceNotFound"));
      return;
    }

    const { distanceKm } = await res.json();
    setForm((prev) => ({ ...prev, estimatedDistanceKm: String(distanceKm) }));
    setDistanceNotice(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        returnAt: form.isRoundTrip ? form.returnAt : undefined,
        estimatedDistanceKm: form.estimatedDistanceKm || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Error");
      return;
    }

    const { request } = await res.json();
    router.push(`/requests/${request.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t("pickupAddress")}>
        <Input
          required
          value={form.pickupAddress}
          onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
        />
      </Field>
      <Field label={t("destinationAddress")}>
        <Input
          required
          value={form.destinationAddress}
          onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
        />
      </Field>
      <Field label={t("departureAt")}>
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
        {t("isRoundTrip")}
      </label>

      {form.isRoundTrip ? (
        <Field label={t("returnAt")}>
          <Input
            type="datetime-local"
            required
            min={form.departureAt || undefined}
            value={form.returnAt}
            onChange={(e) => setForm({ ...form, returnAt: e.target.value })}
          />
        </Field>
      ) : null}

      <Field label={t("passengerCount")}>
        <Input
          type="number"
          min={1}
          required
          value={form.passengerCount}
          onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
        />
      </Field>

      <Field label={t("estimatedDistanceKm")}>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            step="1"
            placeholder={t("estimatedDistanceKmPlaceholder")}
            value={form.estimatedDistanceKm}
            onChange={(e) => setForm({ ...form, estimatedDistanceKm: e.target.value })}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={distanceLoading || !form.pickupAddress || !form.destinationAddress}
            onClick={onCalculateDistance}
          >
            {distanceLoading ? "…" : t("calculateDistance")}
          </Button>
        </div>
        {distanceNotice ? <p className="mt-1 text-xs text-amber-600">{distanceNotice}</p> : null}
      </Field>

      <Field label={t("specialRequests")}>
        <Input
          value={form.specialRequests}
          onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
        />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "…" : t("submit")}
      </Button>
    </form>
  );
}
