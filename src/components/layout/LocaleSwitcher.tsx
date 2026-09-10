"use client";

import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  return (
    <select
      aria-label="Language"
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
      value={(params.locale as string) ?? routing.defaultLocale}
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
