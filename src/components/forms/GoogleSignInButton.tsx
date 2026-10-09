"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

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
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="flex h-[52px] w-full items-center justify-center gap-[10px] rounded-[12px] border border-[#131314] bg-[#131314] text-[16px] font-semibold text-white shadow-[0_6px_18px_rgba(19,19,20,0.18)] transition-colors duration-150 hover:bg-[#2A2A2C] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3563E9] focus-visible:ring-offset-2"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-bold text-[#131314]" aria-hidden="true">
          G
        </span>
        {loading ? t("common.loading") : t("auth.continueWithGoogle")}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
