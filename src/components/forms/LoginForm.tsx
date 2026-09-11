"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { readTripQueryParams, tripQueryParamsToRequestBody } from "@/lib/tripQueryParams";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("auth.invalidCredentials"));
      return;
    }

    const session = await getSession();

    if (session?.user.role === "CLIENT") {
      const trip = readTripQueryParams(searchParams);
      if (trip) {
        const tripRes = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tripQueryParamsToRequestBody(trip)),
        });
        if (tripRes.ok) {
          const { request } = await tripRes.json();
          router.push(`/requests/${request.id}`);
          router.refresh();
          return;
        }
      }
    }

    const destination =
      session?.user.role === "ADMIN"
        ? "/admin/carriers"
        : session?.user.role === "CARRIER"
          ? "/carrier/dashboard"
          : "/dashboard";
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t("common.email")}>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label={t("common.password")}>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("common.loading") : t("auth.loginTitle")}
      </Button>
    </form>
  );
}
