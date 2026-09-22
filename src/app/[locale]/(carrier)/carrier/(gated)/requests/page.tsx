import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";

export default async function CarrierRequestsPage() {
  const t = await getTranslations("carrier");
  const requests = await prisma.ride.findMany({
    where: { carrierId: null, status: "PENDING" },
    include: { client: { select: { name: true, companyName: true } } },
    orderBy: { departureAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("requestsTitle")}</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("noIncomingRequests")}</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} href={`/carrier/requests/${req.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <p className="font-medium text-zinc-900">{formatRoute(req)}</p>
                  <p className="text-sm text-zinc-600">
                    {new Date(req.departureAt).toLocaleString()} · {req.passengerCount} pax · {clientDisplayName(req.client)}
                  </p>
                </div>
                <Badge tone="warning">{req.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
