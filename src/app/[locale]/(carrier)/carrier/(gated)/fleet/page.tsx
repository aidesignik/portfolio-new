import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddVehicleButton } from "@/components/forms/AddVehicleButton";
import { FleetTable } from "@/components/carrier/FleetTable";
import { PageHeader } from "@/components/carrier/PageHeader";
import { PageContent } from "@/components/carrier/PageContent";
import { FilterButton } from "@/components/carrier/FilterButton";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [session, t, params] = await Promise.all([auth(), getTranslations(), searchParams]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const vehicles = await prisma.vehicle.findMany({
    where: { carrierId: carrier.id },
    include: { drivers: { include: { driver: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContent>
      <PageHeader
        title={t("carrier.fleetTitle")}
        bold
        actions={<AddVehicleButton autoOpen={params.new === "1"} />}
      />
      {vehicles.length === 0 ? (
        <p className="text-[13.5px] text-[var(--ink-secondary)]">{t("carrier.noVehicles")}</p>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-2">
            <FilterButton label={t("common.status")} />
            <FilterButton label={t("carrier.table.documents")} />
          </div>
          <FleetTable
            vehicles={vehicles.map((vehicle) => ({
              ...vehicle,
              drivers: vehicle.drivers.map((dv) => dv.driver),
            }))}
            initialEditingId={typeof params.edit === "string" ? params.edit : null}
          />
        </>
      )}
    </PageContent>
  );
}
