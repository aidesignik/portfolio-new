import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { worstDocumentChip, type ChipStatus, type DocumentChipData } from "@/lib/documentChips";

type Translate = (key: string, values?: Record<string, string | number>) => string;

const TONE: Record<ChipStatus, "positive" | "warning" | "negative"> = {
  valid: "positive",
  expiringSoon: "warning",
  expired: "negative",
};

// The design system caps a row at one chip: the single worst document
// problem, or a positive "All documents valid" chip when there is none —
// never one chip per document type.
export function DocumentChipsRow({ chips, t }: { chips: DocumentChipData[]; t: Translate }) {
  if (chips.length === 0) {
    return <span className="text-[13.5px] text-[var(--ink-disabled)]">{t("carrier.table.noDocuments")}</span>;
  }

  const worst = worstDocumentChip(chips);
  if (!worst) {
    return (
      <Badge tone="positive">
        <Check size={13} strokeWidth={2.6} color="#27272B" />
        {t("carrier.docChip.allValid")}
      </Badge>
    );
  }

  const label = t(`carrier.docChip.${worst.docKind}`);
  const text =
    worst.status === "expiringSoon"
      ? t("carrier.docChip.expiringSoon", { label, days: worst.daysLeft })
      : t("carrier.docChip.expired", { label });

  return <Badge tone={TONE[worst.status]}>{text}</Badge>;
}
