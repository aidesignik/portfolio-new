import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";
import { PageHeader } from "@/components/carrier/PageHeader";
import { AddRideButton } from "@/components/forms/AddRideButton";
import { BOOKINGS_GRID_TEMPLATE, BOOKINGS_TABLE_WIDTH } from "@/lib/tableLayout";

const EYEBROW = "text-[11px] font-bold uppercase tracking-[0.065em] text-[var(--ink-eyebrow)]";

export default async function CarrierBookingsPage() {
  const [session, t, tRoot] = await Promise.all([auth(), getTranslations("carrier"), getTranslations()]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const bookings = await prisma.ride.findMany({
    where: { carrierId: carrier.id },
    include: { client: { select: { name: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title={t("bookingsTitle")}
        context={`${bookings.length}`}
        actions={<AddRideButton />}
        contentWidth={BOOKINGS_TABLE_WIDTH}
      />
      <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-4">
        {bookings.length === 0 ? (
          <p className="text-[13.5px] text-[var(--ink-muted)]">—</p>
        ) : (
          <div role="table" className="w-fit overflow-hidden rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
            <div
              role="row"
              className="grid items-center gap-3 border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-3"
              style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
            >
              <span role="columnheader" className={EYEBROW}>{t("bookingsTable.route")}</span>
              <span role="columnheader" className={EYEBROW}>{t("bookingsTable.dateTime")}</span>
              <span role="columnheader" className={EYEBROW}>{t("bookingsTable.passengers")}</span>
              <span role="columnheader" className={EYEBROW}>{tRoot("common.status")}</span>
            </div>
            <div role="rowgroup">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/carrier/bookings/${booking.id}`}
                  role="row"
                  className="grid items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3.5 transition-colors duration-[.12s] ease-out last:border-b-0 hover:bg-[var(--bg-subtle)]"
                  style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
                >
                  <div role="cell" className="min-w-0">
                    <p className="truncate text-[14.5px] font-bold text-[var(--ink-primary)]">{formatRoute(booking)}</p>
                    <p className="truncate text-[13.5px] text-[var(--ink-secondary)]">{clientDisplayName(booking.client)}</p>
                  </div>
                  <div role="cell" className="min-w-0 truncate font-mono text-[13px] text-[var(--ink-secondary)]">
                    {new Date(booking.departureAt).toLocaleString()}
                  </div>
                  <div role="cell" className="min-w-0 truncate text-[13.5px] text-[var(--ink-secondary)]">
                    {booking.passengerCount}
                  </div>
                  <div role="cell" className="min-w-0">
                    <Badge tone="positive">{booking.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
