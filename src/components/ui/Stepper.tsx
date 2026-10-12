"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("common");

  function step(delta: number) {
    const next = value + delta;
    if (next < min) return;
    if (max !== undefined && next > max) return;
    onChange(next);
  }

  return (
    <div className="flex h-10 w-[136px] items-stretch overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--border-control)]">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label={t("decrease")}
        className="flex w-10 shrink-0 items-center justify-center text-[var(--ink-2)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus size={15} strokeWidth={2} aria-hidden="true" />
      </button>
      <div className="flex w-14 shrink-0 items-center justify-center border-x border-[var(--border-soft)] text-[14px] font-medium tabular-nums text-[var(--ink-primary)]">
        {value}
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={max !== undefined && value >= max}
        aria-label={t("increase")}
        className="flex w-10 shrink-0 items-center justify-center text-[var(--ink-2)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
