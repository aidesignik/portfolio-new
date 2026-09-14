"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function GoogleSignInButton() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);

    // Mock Google identity for this demo — a real Google button would never
    // send a name/email up front. Uses a fixed identity so repeat clicks log
    // back into the same account (like real Google auth would), rather than
    // spinning up a new throwaway carrier every time.
    const result = await signIn("google-mock", {
      email: "google.demo.carrier@example.com",
      name: "Demo Carrier (Google)",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("auth.googleAccountTypeMismatch"));
      return;
    }

    // A hard navigation (not router.push) so the browser starts this request
    // only once the new session cookie from signIn() above is fully settled —
    // a client-side transition here could race ahead of it and read a stale
    // session, wrongly bouncing an already-onboarded account back through
    // onboarding.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/carrier/dashboard";
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        disabled={loading}
        onClick={onClick}
      >
        <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.5 5.5C41.4 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>
        {loading ? t("common.loading") : t("auth.continueWithGoogle")}
      </Button>
      <p className="text-center text-xs text-zinc-400">{t("auth.googleMockNotice")}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
