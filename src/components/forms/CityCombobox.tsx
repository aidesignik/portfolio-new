"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";

const SEARCH_DEBOUNCE_MS = 120;

const SHEET_INPUT_CLASS =
  "h-10 w-full rounded-[8px] px-3 text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] shadow-[inset_0_0_0_1px_#E4E4E7] transition-shadow duration-[.12s] ease-out focus:outline-none focus:shadow-[inset_0_0_0_1px_#2563EB,0_0_0_3px_#DBEAFE]";
// "grouped" sits inside a parent field that already draws the border/ring
// (§5.1's one-bordered-field route row) — bare, no border/shadow of its own.
const GROUPED_INPUT_CLASS =
  "h-full min-w-0 flex-1 bg-transparent text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none";
// top-full/left-0 are explicit rather than relying on the default "auto"
// static position — inside a flex container (the "grouped" variant's own
// wrapper is `display:flex`), an absolutely positioned element with no
// inset set falls back to wherever it would've flowed as a flex item
// instead of the container's bottom-left corner, which visibly shifted
// the dropdown to the right.
const SHEET_DROPDOWN_CLASS =
  "absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-[10px] bg-white py-1 text-[14px] shadow-[0_1px_2px_rgba(24,24,27,.04),0_4px_14px_rgba(24,24,27,.06)] ring-1 ring-[#EEEEF0]";
const SHEET_OPTION_CLASS = "block w-full px-3 py-[7px] text-left text-[#3F3F46] hover:bg-[#F4F4F5]";
const DEFAULT_DROPDOWN_CLASS =
  "absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg";
const DEFAULT_OPTION_CLASS = "block w-full px-3 py-1.5 text-left text-zinc-700 hover:bg-zinc-100";

export interface CityComboboxHandle {
  focus: () => void;
}

// City field for pickup/destination/stop rows — searches live via Nominatim
// (/api/cities/search) instead of filtering a fixed list, so any town or
// city anywhere in the world can be found, not just the handful of Serbian
// cities the old static list covered. Purely a suggestion dropdown: the
// input is a normal free-text field underneath, so typing a city that
// doesn't show up in the list (or picking none at all) still works — the
// backend has never required a match against any whitelist.
export const CityCombobox = forwardRef<
  CityComboboxHandle,
  {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
    // "sheet" renders the Nova vožnja v2 field look (§2); "grouped" is the
    // borderless variant for §5.1's merged city+location field. Same
    // fetch/debounce/matching logic in every case — only classNames differ.
    variant?: "default" | "sheet" | "grouped";
    placeholder?: string;
  }
>(function CityCombobox({ value, onChange, required, className = "", variant = "default", placeholder }, ref) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheet = variant === "sheet";
  const grouped = variant === "grouped";

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/cities/search?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          setMatches(Array.isArray(data?.cities) ? data.cities.map((c: { display: string }) => c.display) : []);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  const input = (
    <Input
      ref={inputRef}
      unstyled={sheet || grouped}
      className={sheet ? SHEET_INPUT_CLASS : grouped ? GROUPED_INPUT_CLASS : undefined}
      required={required}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      onChange={(e) => {
        onChange(e.target.value);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    />
  );

  return (
    <div ref={containerRef} className={`relative ${grouped ? "flex min-w-0 flex-1 items-center" : ""} ${className}`}>
      {grouped ? (
        <>
          {input}
          <ChevronDown />
        </>
      ) : (
        input
      )}
      {open && (matches.length > 0 || loading) ? (
        <ul className={sheet || grouped ? SHEET_DROPDOWN_CLASS : DEFAULT_DROPDOWN_CLASS}>
          {matches.map((city) => (
            <li key={city}>
              <button
                type="button"
                className={sheet || grouped ? SHEET_OPTION_CLASS : DEFAULT_OPTION_CLASS}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            </li>
          ))}
          {loading && matches.length === 0 ? (
            <li className={`px-3 py-1.5 ${sheet || grouped ? "text-[#A1A1AA]" : "text-zinc-400"}`}>{t("loading")}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
});

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} className="ml-1 shrink-0 text-[#A1A1AA]" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
