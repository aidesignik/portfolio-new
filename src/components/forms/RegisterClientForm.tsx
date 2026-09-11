"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { readTripQueryParams, tripQueryParamsToRequestBody } from "@/lib/tripQueryParams";

export function RegisterClientForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CLIENT", ...form }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoading(false);
      setError(body?.error === "EMAIL_IN_USE" ? t("auth.emailInUse") : "Error");
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });

    const trip = readTripQueryParams(searchParams);
    if (trip) {
      const tripRes = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripQueryParamsToRequestBody(trip)),
      });
      if (tripRes.ok) {
        const { request } = await tripRes.json();
        setLoading(false);
        router.push(`/requests/${request.id}`);
        router.refresh();
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t("common.name")}>
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label={t("common.email")}>
        <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label={t("common.phone")}>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label={t("common.password")}>
        <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </Field>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("common.loading") : t("auth.registerTitle")}
      </Button>
    </form>
  );
}
