"use client";

import { Minus, Plus } from "lucide-react";

// Numeric stepper (§7 Broj putnika) — a thin presentational wrapper
// around a plain number value, same as any other controlled field.
export function Stepper({
  value,
  onChange,
  min = 1,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  function step(delta: number) {
    const next = value + delta;
    if (next < min) return;
    if (max !== undefined && next > max) return;
    onChange(next);
  }

  return (
    <div className="flex h-10 w-[136px] items-stretch overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_#E4E4E7]">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="-"
        className="flex w-10 shrink-0 items-center justify-center text-[#3F3F46] transition-colors duration-[.12s] ease-out hover:bg-[#F4F4F5] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus size={15} strokeWidth={2} />
      </button>
      <div className="flex w-14 shrink-0 items-center justify-center border-x border-[#EEEEF0] text-[14px] font-medium tabular-nums text-[#18181B]">
        {value}
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={max !== undefined && value >= max}
        aria-label="+"
        className="flex w-10 shrink-0 items-center justify-center text-[#3F3F46] transition-colors duration-[.12s] ease-out hover:bg-[#F4F4F5] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
