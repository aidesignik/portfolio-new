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
        <svg viewBox="0 0 512 512" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
          <path d="M32.582 370.734C15.127 336.291 5.12 297.425 5.12 256c0-41.426 10.007-80.291 27.462-114.735C74.705 57.484 161.047 0 261.12 0c69.12 0 126.836 25.367 171.287 66.793l-73.31 73.309c-26.763-25.135-60.276-38.168-97.977-38.168-66.56 0-123.113 44.917-143.36 105.426-5.12 15.36-8.146 31.65-8.146 48.64 0 16.989 3.026 33.28 8.146 48.64l-.303.232h.303c20.247 60.51 76.8 105.426 143.36 105.426 34.443 0 63.534-9.31 86.341-24.67 27.23-18.152 45.382-45.148 51.433-77.032H261.12v-99.142h241.105c3.025 16.757 4.654 34.211 4.654 52.364 0 77.963-27.927 143.592-76.334 188.276-42.356 39.098-100.305 61.905-169.425 61.905-100.073 0-186.415-57.483-228.538-141.032v-.233z" />
        </svg>
        {loading ? t("common.loading") : t("auth.continueWithGoogle")}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
