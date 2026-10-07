"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { GoogleSignInButton } from "@/components/forms/GoogleSignInButton";
import {
  readTripSearchState,
  tripStateToRequestBody,
} from "@/lib/tripQueryParams";

// One screen for both login and carrier registration — the user never
// picks a mode. Step 1 is just an email; submitting it asks
// /api/auth/check-email whether that address already has an account.
// Step 2 shows a password field with copy (and the submit action) that
// matches what was found: an existing account logs in, a new one
// registers (company details are collected afterward in
// /carrier/onboarding, same as before).
export function AuthCredentialsForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "AccessDenied" ? t("auth.googleAccountTypeMismatch") : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmitEmail(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
    setLoading(false);

    if (!res.ok) {
      setError(t("auth.invalidEmail"));
      return;
    }

    const { exists } = await res.json();
    setAccountExists(exists);
    setStep("password");
  }

  function onChangeEmail() {
    setStep("email");
    setPassword("");
    setError(null);
  }

  async function onSubmitPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!accountExists) {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CARRIER", email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setLoading(false);
        if (body?.error === "EMAIL_IN_USE") {
          setAccountExists(true);
          setError(t("auth.emailInUse"));
        } else if (body?.error?.fieldErrors?.email) {
          setError(t("auth.invalidEmail"));
        } else {
          setError(t("common.saveFailed"));
        }
        return;
      }

      await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      router.push("/carrier/onboarding");
      router.refresh();
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError(t("auth.invalidCredentials"));
      return;
    }

    const session = await getSession();

    if (session?.user.role === "CLIENT") {
      const trip = readTripSearchState(searchParams);
      if (trip) {
        const tripRes = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tripStateToRequestBody(trip)),
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
    <div className="space-y-4">
      <GoogleSignInButton />
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        {t("auth.orDivider")}
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      {step === "email" ? (
        <form onSubmit={onSubmitEmail} className="space-y-4">
          <Field label={t("common.email")}>
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("common.loading") : t("auth.continueButton")}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmitPassword} className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-zinc-700">{email}</span>
            <button
              type="button"
              onClick={onChangeEmail}
              className="shrink-0 font-medium text-zinc-900 underline"
            >
              {t("auth.changeEmail")}
            </button>
          </div>
          <Field label={t("common.password")}>
            <Input
              type="password"
              required
              autoFocus
              minLength={accountExists ? undefined : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {!accountExists ? (
            <p className="text-sm text-zinc-600">{t("auth.registerCarrierSubtitle")}</p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? t("common.loading")
              : accountExists
                ? t("auth.loginTitle")
                : t("auth.createAccountButton")}
          </Button>
        </form>
      )}
    </div>
  );
}
