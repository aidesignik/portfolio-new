"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import type { Carrier } from "@prisma/client";

type Props = {
  carrier: Pick<
    Carrier,
    "companyName" | "taxId" | "contactEmail" | "contactPhone" | "city" | "description" | "licenseInfo"
  > & { ratePerKm: string | null; fixedFee: string | null };
};

export function CarrierProfileForm({ carrier }: Props) {
  const t = useTranslations();
  const [form, setForm] = useState({
    companyName: carrier.companyName,
    taxId: carrier.taxId,
    contactEmail: carrier.contactEmail,
    contactPhone: carrier.contactPhone,
    city: carrier.city,
    description: carrier.description ?? "",
    licenseInfo: carrier.licenseInfo ?? "",
    ratePerKm: carrier.ratePerKm ?? "",
    fixedFee: carrier.fixedFee ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await fetch("/api/carrier/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ratePerKm: form.ratePerKm || undefined,
        fixedFee: form.fixedFee || undefined,
      }),
    });
    setLoading(false);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.companyName")}>
          <Input required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </Field>
        <Field label={t("auth.taxId")}>
          <Input required value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
        </Field>
        <Field label={t("auth.contactEmail")}>
          <Input type="email" required value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </Field>
        <Field label={t("auth.contactPhone")}>
          <Input required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </Field>
        <Field label={t("common.city")}>
          <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>
      <Field label={t("auth.description")}>
        <Input value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label={t("auth.licenseInfo")}>
        <Input value={form.licenseInfo} onChange={(e) => set("licenseInfo", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rate per km (RSD)">
          <Input type="number" min={0} step="0.01" value={form.ratePerKm} onChange={(e) => set("ratePerKm", e.target.value)} />
        </Field>
        <Field label="Fixed fee (RSD)">
          <Input type="number" min={0} step="0.01" value={form.fixedFee} onChange={(e) => set("fixedFee", e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("common.save")}
        </Button>
        {saved ? <span className="text-sm text-emerald-600">{t("carrier.profileSaved")}</span> : null}
      </div>
    </form>
  );
}
