"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  companyName: "",
  taxId: "",
  contactEmail: "",
  contactPhone: "",
  city: "",
  description: "",
};

export function RegisterCarrierForm() {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CARRIER", ...form }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoading(false);
      setError(body?.error === "EMAIL_IN_USE" ? t("auth.emailInUse") : "Error");
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    router.push("/carrier/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("common.name")}>
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label={t("common.email")}>
          <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label={t("common.phone")}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label={t("common.password")}>
          <Input type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
      </div>

      <hr className="border-zinc-200" />

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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("common.loading") : t("auth.registerCarrierTitle")}
      </Button>
    </form>
  );
}
