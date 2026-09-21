import { Badge } from "@/components/ui/Badge";
import type { ChipStatus, DocumentChipData } from "@/lib/documentChips";

type Translate = (key: string, values?: Record<string, string | number>) => string;

const TONE: Record<ChipStatus, "positive" | "warning" | "negative"> = {
  valid: "positive",
  expiringSoon: "warning",
  expired: "negative",
};

// One small chip per document, never a single collapsed Expired/Active
// badge — green "✓ [Document]" when valid, amber "[Document] · Nd" when
// expiring soon, red "[Document] expired" when past its date.
export function DocumentChipsRow({ chips, t }: { chips: DocumentChipData[]; t: Translate }) {
  if (chips.length === 0) {
    return <span className="text-xs text-zinc-400">{t("carrier.table.noDocuments")}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip) => {
        const label = t(`carrier.docChip.${chip.docKind}`);
        const text =
          chip.status === "valid"
            ? t("carrier.docChip.valid", { label })
            : chip.status === "expiringSoon"
              ? t("carrier.docChip.expiringSoon", { label, days: chip.daysLeft })
              : t("carrier.docChip.expired", { label });
        return (
          <Badge key={chip.docKind} tone={TONE[chip.status]}>
            {text}
          </Badge>
        );
      })}
    </div>
  );
}
