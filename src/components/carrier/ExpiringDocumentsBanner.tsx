import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ExpiringItem } from "@/lib/expiryStatus";

const DOC_LABEL_KEY: Record<ExpiringItem["docKind"], string> = {
  registration: "carrier.expiry.registration",
  inspection: "carrier.expiry.inspection",
  idCard: "carrier.driverForm.idCard",
  license: "carrier.driverForm.license",
  cpc: "carrier.driverForm.cpc",
  medicalCert: "carrier.driverForm.medicalCert",
};

// Deliberately loud — an amber/red bordered banner right at the top of the
// dashboard, not a badge tucked away somewhere — so a carrier can't miss a
// vehicle or driver document that's expired or about to.
export async function ExpiringDocumentsBanner({ items }: { items: ExpiringItem[] }) {
  if (items.length === 0) return null;

  const t = await getTranslations();
  const hasExpired = items.some((item) => item.status === "expired");

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        hasExpired ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
      }`}
    >
      <p className={`text-sm font-semibold ${hasExpired ? "text-red-800" : "text-amber-800"}`}>
        ⚠ {t("carrier.expiry.bannerTitle")}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm">
            <Link
              href={item.entityType === "vehicle" ? `/carrier/fleet/${item.entityId}` : `/carrier/drivers/${item.entityId}`}
              className="font-medium text-zinc-900 underline hover:no-underline"
            >
              {item.entityLabel}
            </Link>
            {" — "}
            <span className={item.status === "expired" ? "text-red-700" : "text-amber-700"}>
              {t(DOC_LABEL_KEY[item.docKind])} {t(`carrier.expiry.${item.status}`).toLowerCase()} (
              {item.expiryDate.toLocaleDateString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
