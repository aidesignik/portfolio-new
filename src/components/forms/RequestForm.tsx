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
    passengerCount: "40",
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Error");
      return;
    }

    router.push("/requests");
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
      <Field label={t("passengerCount")}>
        <Input
          type="number"
          min={1}
          required
          value={form.passengerCount}
          onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
        />
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
