"use client";

import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const FLAGS: Record<string, string> = { en: "🇬🇧", sr: "🇷🇸" };
const LOCALE_NAMES: Record<string, string> = { en: "English", sr: "Srpski" };

export function LocaleSwitcher({ variant = "select" }: { variant?: "select" | "flag" } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const current = (params.locale as string) ?? routing.defaultLocale;

  if (variant === "flag") {
    const other = routing.locales.find((locale) => locale !== current) ?? current;
    return (
      <button
        type="button"
        aria-label={`Switch language to ${LOCALE_NAMES[other] ?? other}`}
        onClick={() => router.replace(pathname, { locale: other })}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] leading-none hover:bg-zinc-100"
      >
        <span aria-hidden="true">{FLAGS[current] ?? current.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <select
      aria-label="Language"
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
      value={current}
      onChange={(event) => {
        router.replace(pathname, { locale: event.target.value });
      }}
    >
      {routing.locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale === "sr" ? "SR" : "EN"}
        </option>
      ))}
    </select>
  );
}
