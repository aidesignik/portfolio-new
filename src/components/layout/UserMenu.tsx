"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignOutButton } from "./SignOutButton";

const MENU_ITEM_CLASS = "block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50";

function initialsFor(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "?";
}

// Avatar in the header — click opens a dropdown showing who's signed in
// (company name + email) and the account actions that used to be flat
// links in the header (Profile, language, sign out).
export function UserMenu({
  name,
  email,
  image,
  profileHref,
  size = 32,
}: {
  name: string;
  email: string | null;
  image?: string | null;
  profileHref: string | null;
  size?: 32 | 34;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("accountMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{ height: size, width: size }}
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-medium text-white transition-opacity duration-[.12s] ease-out hover:opacity-80"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          initialsFor(name)
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg"
        >
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-zinc-900">{name}</p>
            {email ? <p className="truncate text-xs text-zinc-500">{email}</p> : null}
          </div>
          <div className="flex flex-col gap-0.5 py-1">
            {profileHref ? (
              <Link href={profileHref} onClick={() => setOpen(false)} className={MENU_ITEM_CLASS}>
                {t("profile")}
              </Link>
            ) : null}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-zinc-700">{tCommon("language")}</span>
              <LocaleSwitcher />
            </div>
            <SignOutButton label={t("logout")} className={MENU_ITEM_CLASS} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
