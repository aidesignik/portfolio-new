import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Figtree, IBM_Plex_Mono, Sora } from "next/font/google";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/components/layout/AuthProvider";
import "../globals.css";

// Body/UI text — nav, buttons, inputs, labels, table text, everything that
// isn't a heading or the logo. Injected as --font-figtree (not --font-sans
// directly) because globals.css maps Tailwind's --font-sans theme token to
// this variable via `@theme inline` — naming this variable --font-sans
// too would make that mapping `--font-sans: var(--font-sans)`, a cyclic
// custom-property reference that resolves to nothing everywhere.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

// Headings (h1–h3) and the logo wordmark only — see the `h1, h2, h3` rule
// in globals.css. No 800 weight: nothing in the app should ever request
// it and silently fall back to a synthesized bold. Same --font-sora /
// --font-display distinction as above, for the same reason.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travia — digital dispatcher for coach transport",
  description: "Organize bus and coach transport bookings end to end.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${figtree.variable} ${ibmPlexMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        <NextIntlClientProvider>
          <AuthProvider>
            <div className="flex-1">{children}</div>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
