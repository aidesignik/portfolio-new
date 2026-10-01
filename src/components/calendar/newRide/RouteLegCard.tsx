"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { DatePicker, type DatePickerHandle } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

// Card shell shared by the Odlazak and Povratak cards (§5): the arrow +
// name + per-leg km header, wrapping whatever body the caller provides.
export function LegCard({
  direction,
  title,
  km,
  children,
}: {
  direction: "outbound" | "return";
  title: string;
  km: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[12px] p-4 shadow-[inset_0_0_0_1px_#EEEEF0]">
      <div className="flex flex-col gap-[14px]">
        <div className="flex items-center gap-2">
          {direction === "outbound" ? (
            <ArrowRight size={15} strokeWidth={1.9} className="shrink-0 text-[#3F3F46]" />
          ) : (
            <ArrowLeft size={15} strokeWidth={1.9} className="shrink-0 text-[#3F3F46]" />
          )}
          <span className="flex-1 text-[13.5px] font-semibold text-[#18181B]">{title}</span>
          <span className="shrink-0 text-[12.5px] tabular-nums text-[#71717A]">{km}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// Date + time row under a leg's timeline (§5.1/§5.2), aligned to the
// timeline's inputs via the 30px left padding.
export function DateTimeRow({
  dateValue,
  onDateChange,
  timeValue,
  onTimeChange,
  minDate,
  dateRef,
  datePlaceholder,
  timePlaceholder,
  dateError,
  timeError,
}: {
  dateValue: string;
  onDateChange: (date: string) => void;
  timeValue: string;
  onTimeChange: (time: string) => void;
  minDate?: string;
  dateRef?: Ref<DatePickerHandle>;
  datePlaceholder: string;
  timePlaceholder: string;
  dateError?: boolean;
  timeError?: boolean;
}) {
  return (
    <div className="grid gap-2 pl-[30px]" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <DatePicker
        ref={dateRef}
        value={dateValue}
        onChange={onDateChange}
        minDate={minDate}
        placeholder={datePlaceholder}
        error={dateError}
      />
      <TimePicker value={timeValue} onChange={onTimeChange} placeholder={timePlaceholder} error={timeError} />
    </div>
  );
}
