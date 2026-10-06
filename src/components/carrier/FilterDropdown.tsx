"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  size = "sm",
}: {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  // "lg" matches the 40px-tall controls in the calendar toolbar; every
  // other usage (Rezervacije/Vozni park/Vozači filter rows) keeps the
  // default compact size.
  size?: "sm" | "lg";
}) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? null;
  const active = selected !== null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-[6px] rounded-[8px] border font-medium transition-colors duration-[.12s] ease-out ${
          size === "lg" ? "h-10 px-[14px] text-[13.5px]" : "h-8 px-3 text-[13px]"
        } ${
          active
            ? "border-[#2563EB] bg-[#EFF4FF] text-[#2563EB]"
            : "border-[var(--border-control)] text-[var(--ink-body)] hover:bg-[var(--border-soft)]"
        }`}
      >
        {selected ? selected.label : label}
        <ChevronDown size={13} strokeWidth={1.9} />
      </button>
      {open ? (
        <div className="absolute left-0 z-[60] mt-1 w-56 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] py-1 shadow-[var(--shadow-card)]">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`block w-full truncate px-3 text-left text-[13.5px] leading-9 hover:bg-[var(--border-soft)] ${
              active ? "text-[var(--ink-body)]" : "font-medium text-[var(--ink-primary)]"
            }`}
          >
            {t("all")}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full truncate px-3 text-left text-[13.5px] leading-9 hover:bg-[var(--border-soft)] ${
                opt.value === value ? "font-medium text-[var(--ink-primary)]" : "text-[var(--ink-body)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
