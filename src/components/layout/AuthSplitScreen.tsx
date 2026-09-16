import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AuthRouteSketch } from "./AuthRouteSketch";

// Shared split-screen shell for the login/register pages: the form on the
// left, a dark marketing panel (same carrier pitch on both pages, since
// there's only one audience while the client marketplace is hidden) on the
// right. The panel is decorative, so it's dropped below the lg breakpoint
// rather than stacked under the form.
export async function AuthSplitScreen({ children }: { children: ReactNode }) {
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">{children}</div>

        <div className="relative hidden flex-col justify-center overflow-hidden bg-zinc-900 px-10 py-12 text-white lg:flex">
          <AuthRouteSketch className="pointer-events-none absolute inset-0 h-full w-full" />
          <div className="relative space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("carrierMarketingTitle")}
            </h2>
            <p className="text-zinc-300">{t("carrierMarketingSubtitle")}</p>
            <ul className="space-y-3 text-sm text-zinc-200">
              <li className="flex gap-2">
                <span className="text-zinc-400">✓</span> {t("carrierBenefit1")}
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">✓</span> {t("carrierBenefit2")}
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">✓</span> {t("carrierBenefit3")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
