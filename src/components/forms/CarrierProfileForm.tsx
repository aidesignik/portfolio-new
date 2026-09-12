"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import type { Carrier } from "@prisma/client";

type ExistingCarrier = Pick<
  Carrier,
  | "companyName"
  | "taxId"
  | "contactEmail"
  | "contactPhone"
  | "city"
  | "description"
  | "licenseInfo"
> & { ratePerKm: string | null; fixedFee: string | null };

type Props = {
  carrier: ExistingCarrier | null;
  email: string;
  contactPersonName?: string | null;
};

export function CarrierProfileForm({
  carrier,
  email,
  contactPersonName,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { update } = useSession();
  const isNew = carrier === null;
  const [form, setForm] = useState({
    contactPerson: contactPersonName ?? "",
    companyName: carrier?.companyName ?? "",
    taxId: carrier?.taxId ?? "",
    contactEmail: carrier?.contactEmail ?? email,
    contactPhone: carrier?.contactPhone ?? "",
    city: carrier?.city ?? "",
    description: carrier?.description ?? "",
    licenseInfo: carrier?.licenseInfo ?? "",
    ratePerKm: carrier?.ratePerKm ?? "",
    fixedFee: carrier?.fixedFee ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/carrier/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactPerson: form.contactPerson || undefined,
        companyName: form.companyName,
        taxId: form.taxId,
        contactEmail: isNew ? email : form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        city: form.city,
        description: form.description || undefined,
        ...(isNew
          ? {}
          : {
              licenseInfo: form.licenseInfo || undefined,
              ratePerKm: form.ratePerKm || undefined,
              fixedFee: form.fixedFee || undefined,
            }),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoading(false);
      setError(
        body?.error === "TAX_ID_IN_USE"
          ? t("auth.taxIdInUse")
          : t("common.saveFailed"),
      );
      return;
    }

    if (isNew) {
      // Passing an (even empty) object forces a POST with trigger: "update",
      // which re-runs the jwt callback to pick up the carrier just created —
      // update() with no args only GETs the still-stale cached session.
      await update({});
      router.push("/carrier/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("carrier.contactPerson")}>
          <Input
            required
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
          />
        </Field>
        <Field label={isNew ? t("common.email") : t("auth.contactEmail")}>
          <Input
            type="email"
            required
            disabled={isNew}
            value={isNew ? email : form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </Field>
        <Field label={t("auth.companyName")}>
          <Input
            required
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
          />
        </Field>
        <Field label={t("auth.taxId")}>
          <Input
            required
            value={form.taxId}
            onChange={(e) => set("taxId", e.target.value)}
          />
        </Field>
        <Field label={t("common.city")}>
          <Input
            required
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        {isNew ? null : (
          <Field label={t("auth.contactPhone")}>
            <Input
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
            />
          </Field>
        )}
      </div>
      <Field label={t("auth.description")}>
        <Input
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      {isNew ? null : (
        <>
          <Field label={t("auth.licenseInfo")}>
            <Input
              value={form.licenseInfo}
              onChange={(e) => set("licenseInfo", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rate per km (RSD)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.ratePerKm}
                onChange={(e) => set("ratePerKm", e.target.value)}
              />
            </Field>
            <Field label="Fixed fee (RSD)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.fixedFee}
                onChange={(e) => set("fixedFee", e.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? t("common.loading")
            : isNew
              ? t("carrier.completeProfileCta")
              : t("common.save")}
        </Button>
        {saved ? (
          <span className="text-sm text-emerald-600">
            {t("carrier.profileSaved")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
