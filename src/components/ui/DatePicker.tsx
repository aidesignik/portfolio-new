"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatPickerDate,
  formatPickerMonthYear,
  formatPickerWeekday,
  parseDateOnly,
  toDateOnlyString,
} from "@/lib/pickerDateFormat";

export interface DatePickerHandle {
  open: () => void;
}

// Custom calendar popover (§2 Date field) — works on a plain "YYYY-MM-DD"
// string, same value shape the rest of the form already combines into the
// datetime-local string it sends on submit; this only changes how that
// value is picked, not what it is.
export const DatePicker = forwardRef<
  DatePickerHandle,
  {
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
    placeholder?: string;
    error?: boolean;
  }
>(function DatePicker({ value, onChange, minDate, placeholder, error }, ref) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);
  const minD = minDate ? parseDateOnly(minDate) : null;
  const [viewDate, setViewDate] = useState(() => selected ?? minD ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  useEffect(() => {
    if (open) setViewDate(selected ?? minD ?? new Date());
    // Only when the popover opens — not on every keystroke/value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const minStr = minD ? toDateOnlyString(minD) : null;
  const selectedStr = selected ? toDateOnlyString(selected) : null;
  const todayStr = toDateOnlyString(new Date());

  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    formatPickerWeekday(new Date(2024, 0, 1 + i), locale),
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[14px] transition-shadow duration-[.12s] ease-out focus:outline-none focus-visible:shadow-[inset_0_0_0_1px_#2563EB,0_0_0_3px_#DBEAFE] ${
          error ? "shadow-[inset_0_0_0_1px_#FCA5A5]" : "shadow-[inset_0_0_0_1px_#E4E4E7]"
        }`}
      >
        <Calendar size={15} className="shrink-0 text-[#A1A1AA]" />
        <span className={selected ? "truncate text-[#18181B]" : "truncate text-[#A1A1AA]"}>
          {selected ? formatPickerDate(selected, locale) : placeholder}
        </span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-[280px] rounded-[12px] bg-white p-3 shadow-[0_1px_2px_rgba(24,24,27,.04),0_4px_14px_rgba(24,24,27,.06)] ring-1 ring-[#EEEEF0]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#71717A] hover:bg-[#F4F4F5]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13.5px] font-semibold text-[#18181B]">
              {formatPickerMonthYear(viewDate, locale)}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#71717A] hover:bg-[#F4F4F5]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {weekdayLabels.map((w, i) => (
              <span key={i} className="text-[11px] font-medium text-[#A1A1AA]">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const str = toDateOnlyString(d);
              const disabled = minStr !== null && str < minStr;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(str);
                    setOpen(false);
                  }}
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors duration-[.12s] ease-out ${
                    str === selectedStr
                      ? "bg-[#2563EB] font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-[#D4D4D8]"
                        : str === todayStr
                          ? "font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
                          : "text-[#3F3F46] hover:bg-[#F4F4F5]"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
});
