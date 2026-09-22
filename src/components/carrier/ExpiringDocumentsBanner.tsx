import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ExpiringItem } from "@/lib/expiryStatus";

const DOC_LABEL_KEY: Record<ExpiringItem["docKind"], string> = {
  registration: "carrier.docChip.registration",
  inspection: "carrier.docChip.inspection",
  idCard: "carrier.docChip.idCard",
  license: "carrier.docChip.license",
  cpc: "carrier.docChip.cpc",
  medicalCert: "carrier.docChip.medicalCert",
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The "needs attention" rail: a quiet list (8px status dot + name + mono
// issue/countdown), not a loud banner — expired and expiring-soon items
// stay easy to scan without dominating the dashboard.
export async function ExpiringDocumentsBanner({ items }: { items: ExpiringItem[] }) {
  if (items.length === 0) return null;

  const t = await getTranslations();
  const now = new Date().getTime();

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
      <div className="border-b border-[var(--border-soft)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.065em] text-[var(--ink-eyebrow)]">
          {t("carrier.expiry.bannerTitle")}
        </p>
      </div>
      <div>
        {items.map((item, index) => {
          const label = t(DOC_LABEL_KEY[item.docKind]);
          const daysLeft = Math.max(0, Math.ceil((item.expiryDate.getTime() - now) / DAY_MS));
          const issue =
            item.status === "expired"
              ? t("carrier.docChip.expired", { label })
              : t("carrier.docChip.expiringSoon", { label, days: daysLeft });
          return (
            <Link
              key={index}
              href={item.entityType === "vehicle" ? `/carrier/fleet/${item.entityId}` : `/carrier/drivers/${item.entityId}`}
              className="flex items-center gap-[10px] border-b border-[var(--border-soft)] px-4 py-[10px] transition-colors duration-[.12s] ease-out last:border-b-0 hover:bg-[var(--bg-subtle)]"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: item.status === "expired" ? "#F87171" : "#FDBA74" }}
              />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--ink-primary)]">
                {item.entityLabel}
              </span>
              <span className="shrink-0 font-mono text-[11.5px] text-[var(--ink-muted)]">{issue}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
