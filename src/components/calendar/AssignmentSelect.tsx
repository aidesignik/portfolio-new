"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  SHEET_SELECT_CLASS,
  SHEET_DROPDOWN_CLASS,
  SHEET_OPTION_CLASS,
  DEFAULT_DROPDOWN_CLASS,
  DEFAULT_OPTION_CLASS,
} from "./newRide/sheetFieldClasses";

// Mirrors Select.tsx's own DEFAULT_CLASS (not exported from there) so the
// "default" variant's trigger matches a plain <Select> exactly.
const DEFAULT_TRIGGER_CLASS =
  "flex h-[42px] w-full items-center justify-between gap-2 rounded-control border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-3 text-left text-[14px] text-[var(--ink-primary)] transition-[border-color,box-shadow] duration-[.12s] ease-out focus:outline-none focus:border-[var(--action-bg)] focus:shadow-[var(--focus-ring)]";

export interface AssignmentOption {
  id: string;
  label: string;
  // A vehicle/driver that already has an overlapping ride or block — still
  // selectable, just flagged, since a carrier may deliberately double-book
  // (a long trip plus a quick local run, a standby driver, etc.) and the
  // server's availability check is advisory, not a hard block.
  busy?: boolean;
  // Vehicle doesn't seat the ride's current passenger count — rendered in
  // the destructive color like the old native <option style>, still
  // selectable.
  warn?: boolean;
}

// Custom-styled replacement for a native <select> wherever the picked
// resource (vehicle or driver) might already be booked: a browser's native
// <option> list can't carry a per-row "Already booked" badge, so this
// renders the whole list itself instead, styled like the rest of the
// design system's dropdowns (CityCombobox/ClientCombobox/FilterDropdown).
export function AssignmentSelect({
  value,
  onChange,
  options,
  placeholder,
  busyLabel,
  disabled = false,
  variant = "default",
}: {
  value: string;
  onChange: (id: string) => void;
  options: AssignmentOption[];
  placeholder: string;
  busyLabel: string;
  disabled?: boolean;
  variant?: "default" | "sheet";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheet = variant === "sheet";

  function closeAndRefocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAndRefocus();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`${sheet ? SHEET_SELECT_CLASS : DEFAULT_TRIGGER_CLASS} ${sheet ? "flex items-center justify-between" : ""} disabled:cursor-not-allowed disabled:opacity-60`}
        style={selected?.warn ? { color: "var(--ink-destructive)" } : undefined}
      >
        <span className={`truncate ${selected ? "" : "text-[var(--ink-muted)]"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={1.9} className="shrink-0 text-[var(--ink-muted)]" />
      </button>
      {open ? (
        <ul role="listbox" className={sheet ? SHEET_DROPDOWN_CLASS : DEFAULT_DROPDOWN_CLASS}>
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                setOpen(false);
              }}
              className={sheet ? SHEET_OPTION_CLASS : DEFAULT_OPTION_CLASS}
            >
              {placeholder}
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 ${sheet ? SHEET_OPTION_CLASS : DEFAULT_OPTION_CLASS}`}
              >
                <span className="truncate" style={opt.warn ? { color: "var(--ink-destructive)" } : undefined}>
                  {opt.label}
                </span>
                {opt.busy ? (
                  <span className="shrink-0 rounded-[6px] bg-[#FFF8EC] px-[6px] py-[2px] text-[11px] font-medium text-[#9A5B0F]">
                    {busyLabel}
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
