import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";
import { PageHeader } from "@/components/carrier/PageHeader";

export default async function CarrierRequestsPage() {
  const t = await getTranslations("carrier");
  const requests = await prisma.ride.findMany({
    where: { carrierId: null, status: "PENDING" },
    include: { client: { select: { name: true, companyName: true } } },
    orderBy: { departureAt: "asc" },
  });

  return (
    <>
      <PageHeader title={t("requestsTitle")} context={`${requests.length}`} />
      <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-4">
        {requests.length === 0 ? (
          <p className="text-[13.5px] text-[var(--ink-muted)]">{t("noIncomingRequests")}</p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/carrier/requests/${req.id}`}
                className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-[14px] transition-colors duration-[.12s] ease-out last:border-b-0 hover:bg-[var(--bg-subtle)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-bold text-[var(--ink-primary)]">{formatRoute(req)}</p>
                  <p className="truncate text-[13.5px] text-[var(--ink-secondary)]">
                    {new Date(req.departureAt).toLocaleString()} · {req.passengerCount} pax · {clientDisplayName(req.client)}
                  </p>
                </div>
                <Badge tone="warning">{req.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
