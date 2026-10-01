"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

export interface ClientMatch {
  id: string;
  companyName: string | null;
  name: string | null;
  email: string;
  phone: string | null;
}

const SEARCH_DEBOUNCE_MS = 300;

const SHEET_INPUT_CLASS =
  "h-10 w-full rounded-[8px] px-3 text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] shadow-[inset_0_0_0_1px_#E4E4E7] transition-shadow duration-[.12s] ease-out focus:outline-none focus:shadow-[inset_0_0_0_1px_#2563EB,0_0_0_3px_#DBEAFE]";
const SHEET_DROPDOWN_CLASS =
  "absolute left-0 top-full z-10 mt-1 max-h-56 w-full overflow-auto rounded-[10px] bg-white py-1 text-[14px] shadow-[0_1px_2px_rgba(24,24,27,.04),0_4px_14px_rgba(24,24,27,.06)] ring-1 ring-[#EEEEF0]";
const SHEET_OPTION_CLASS = "block w-full px-3 py-[7px] text-left hover:bg-[#F4F4F5]";
const DEFAULT_DROPDOWN_CLASS =
  "absolute left-0 top-full z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg";
const DEFAULT_OPTION_CLASS = "block w-full px-3 py-1.5 text-left hover:bg-zinc-100";

// Client/company-name field for the "New ride" form — as a carrier types a
// name, shows matching clients they've booked for before (scoped
// server-side, see /api/carrier/clients) so picking one can autofill the
// contact person/email/phone. Selecting a match is the only way those
// fields get overwritten — typing alone never does, and everything stays a
// normal editable input afterward.
export function ClientCombobox({
  value,
  onChange,
  onSelectClient,
  placeholder,
  className = "",
  variant = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectClient: (client: ClientMatch) => void;
  placeholder?: string;
  className?: string;
  // See CityCombobox's variant prop — same idea, same logic either way.
  variant?: "default" | "sheet";
}) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<ClientMatch[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheet = variant === "sheet";

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
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/carrier/clients?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setMatches(data.clients);
        })
        .catch(() => {});
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        unstyled={sheet}
        className={sheet ? SHEET_INPUT_CLASS : undefined}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && matches.length > 0 ? (
        <ul className={sheet ? SHEET_DROPDOWN_CLASS : DEFAULT_DROPDOWN_CLASS}>
          {matches.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                className={sheet ? SHEET_OPTION_CLASS : DEFAULT_OPTION_CLASS}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectClient(client);
                  setOpen(false);
                }}
              >
                <span className={`block truncate font-medium ${sheet ? "text-[#18181B]" : "text-zinc-900"}`}>
                  {client.companyName || client.name || client.email}
                </span>
                {client.companyName && client.name ? (
                  <span className={`block truncate text-xs ${sheet ? "text-[#A1A1AA]" : "text-zinc-500"}`}>
                    {client.name}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
