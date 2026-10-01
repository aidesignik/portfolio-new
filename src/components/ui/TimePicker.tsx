"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(i / 2))}:${pad((i % 2) * 30)}`;
});

function isValidTime(v: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

// Custom time popover (§2 Time field) — a free-text "HH:mm" entry (so any
// departure time works, not just half-hour slots) plus a scrollable list of
// common times for a quick pick. Works on the same "HH:mm" string the form
// already combines into the datetime-local value.
export function TimePicker({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function commit(v: string) {
    if (isValidTime(v)) {
      onChange(v);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[14px] transition-shadow duration-[.12s] ease-out focus:outline-none focus-visible:shadow-[inset_0_0_0_1px_#2563EB,0_0_0_3px_#DBEAFE] ${
          error ? "shadow-[inset_0_0_0_1px_#FCA5A5]" : "shadow-[inset_0_0_0_1px_#E4E4E7]"
        }`}
      >
        <Clock size={15} className="shrink-0 text-[#A1A1AA]" />
        <span className={value ? "tabular-nums text-[#18181B]" : "text-[#A1A1AA]"}>{value || placeholder}</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-[160px] rounded-[12px] bg-white p-2 shadow-[0_1px_2px_rgba(24,24,27,.04),0_4px_14px_rgba(24,24,27,.06)] ring-1 ring-[#EEEEF0]">
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            placeholder="HH:mm"
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit(draft);
            }}
            onBlur={() => commit(draft)}
            className="mb-2 h-8 w-full rounded-[6px] px-2 text-[13px] tabular-nums text-[#18181B] shadow-[inset_0_0_0_1px_#E4E4E7] focus:outline-none focus:shadow-[inset_0_0_0_1px_#2563EB]"
          />
          <div className="max-h-[200px] overflow-y-auto">
            {OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(t);
                  setOpen(false);
                }}
                className={`block w-full rounded-[6px] px-2 py-1 text-left text-[13px] tabular-nums hover:bg-[#F4F4F5] ${
                  t === value ? "bg-[#EFF6FF] font-medium text-[#2563EB]" : "text-[#3F3F46]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
