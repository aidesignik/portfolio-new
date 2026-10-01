"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";

const SEARCH_DEBOUNCE_MS = 120;

// City field for pickup/destination/stop rows — searches live via Nominatim
// (/api/cities/search) instead of filtering a fixed list, so any town or
// city anywhere in the world can be found, not just the handful of Serbian
// cities the old static list covered. Purely a suggestion dropdown: the
// input is a normal free-text field underneath, so typing a city that
// doesn't show up in the list (or picking none at all) still works — the
// backend has never required a match against any whitelist.
export function CityCombobox({
  value,
  onChange,
  required,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        required={required}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (matches.length > 0 || loading) ? (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg">
          {matches.map((city) => (
            <li key={city}>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-zinc-700 hover:bg-zinc-100"
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
            <li className="px-3 py-1.5 text-zinc-400">{t("loading")}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
