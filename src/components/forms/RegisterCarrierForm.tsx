"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { GoogleSignInButton } from "@/components/forms/GoogleSignInButton";

export function RegisterCarrierForm() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CARRIER", email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoading(false);
      setError(body?.error === "EMAIL_IN_USE" ? t("auth.emailInUse") : t("common.saveFailed"));
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/carrier/onboarding");
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
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("common.email")}>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t("common.password")}>
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t("common.loading") : t("auth.registerCarrierTitle")}
        </Button>
      </form>
    </div>
  );
}
