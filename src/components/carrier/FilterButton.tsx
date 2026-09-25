import { ChevronDown } from "lucide-react";

export function FilterButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-8 items-center gap-[6px] rounded-[8px] border border-[var(--border-control)] px-3 text-[13.5px] font-medium text-[var(--ink-body)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
    >
      {label}
      <ChevronDown size={14} strokeWidth={1.9} />
    </button>
  );
}
