import type { ReactNode } from "react";
import { X } from "lucide-react";

export function PanelHeader({
  title,
  subtitle,
  onClose,
  closeLabel,
  actions,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-[18px]">
      <div className="min-w-0">
        <h2 className="truncate text-[18px] font-bold text-[var(--ink-primary)]">{title}</h2>
        {subtitle ? <p className="mt-[2px] truncate text-[12.5px] text-[var(--ink-muted)]">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[var(--ink-disabled)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)] hover:text-[var(--ink-2)]"
        >
          <X size={17} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}
