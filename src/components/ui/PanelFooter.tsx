import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function PanelFooter({
  onCancel,
  cancelLabel,
  submitLabel,
  loading,
  loadingLabel,
}: {
  onCancel?: () => void;
  cancelLabel: string;
  submitLabel: ReactNode;
  loading?: boolean;
  loadingLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-[10px] border-t border-[var(--border-soft)] px-5 py-[14px]">
      {onCancel ? (
        <Button type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : null}
      <Button type="submit" disabled={loading} className="flex-1">
        {loading ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
}
