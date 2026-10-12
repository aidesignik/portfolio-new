import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CarrierApprovalActions } from "@/components/forms/CarrierApprovalActions";

export default async function AdminCarriersPage() {
  const t = await getTranslations("admin");
  const carriers = await prisma.carrier.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--ink-primary)]">{t("carriersTitle")}</h1>

      {carriers.length === 0 ? (
        <p className="text-sm text-[var(--ink-secondary)]">{t("noPending")}</p>
      ) : (
        <div className="space-y-3">
          {carriers.map((carrier) => (
            <Card key={carrier.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--ink-primary)]">{carrier.companyName}</p>
                <p className="text-sm text-[var(--ink-secondary)]">
                  {carrier.city} · {carrier.taxId} · {carrier.user.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  tone={
                    carrier.status === "APPROVED"
                      ? "positive"
                      : carrier.status === "REJECTED"
                        ? "negative"
                        : "warning"
                  }
                >
                  {t(`carrierStatus.${carrier.status}`)}
                </Badge>
                {carrier.status === "PENDING" ? (
                  <CarrierApprovalActions carrierId={carrier.id} />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
