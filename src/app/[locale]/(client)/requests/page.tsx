import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";

export default async function ClientRequestsPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("client")]);
  const requests = await prisma.bookingRequest.findMany({
    where: { clientId: session!.user.id },
    include: { offers: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("myRequests")}</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("noRequests")}</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} href={`/requests/${req.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <p className="font-medium text-zinc-900">
                    {req.pickupAddress} → {req.destinationAddress}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {new Date(req.departureAt).toLocaleString()} · {req.offers.length} offer(s)
                  </p>
                </div>
                <Badge tone={req.status === "CONFIRMED" ? "positive" : "neutral"}>
                  {t(`requestStatus.${req.status}`)}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
