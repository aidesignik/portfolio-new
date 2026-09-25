import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";
import { PageHeader } from "@/components/carrier/PageHeader";
import { PageContent } from "@/components/carrier/PageContent";
import { FilterButton } from "@/components/carrier/FilterButton";
import { StatusDot } from "@/components/carrier/StatusDot";
import { AddRideButton } from "@/components/forms/AddRideButton";
import { BOOKINGS_GRID_TEMPLATE } from "@/lib/tableLayout";
import { RIDE_STATUS_ACCENT } from "@/components/calendar/statusStyles";

const HEADER_CLASS = "text-[13px] text-[var(--ink-secondary)]";

type Scope = "upcoming" | "past" | "all";
type SearchParams = Record<string, string | string[] | undefined>;

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default async function CarrierBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [session, t, tRoot, params] = await Promise.all([
    auth(),
    getTranslations("carrier"),
    getTranslations(),
    searchParams,
  ]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const allBookings = await prisma.ride.findMany({
    where: { carrierId: carrier.id },
    include: { client: { select: { name: true, companyName: true } }, vehicle: { select: { seats: true } } },
    orderBy: { departureAt: "desc" },
  });

  const now = new Date();
  const upcoming = allBookings.filter((b) => b.departureAt >= now && b.status !== "CANCELLED");
  const past = allBookings.filter((b) => b.departureAt < now || b.status === "CANCELLED");

  const scopeParam = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  const scope: Scope = scopeParam === "past" || scopeParam === "all" ? scopeParam : "upcoming";
  const bookings = scope === "upcoming" ? upcoming : scope === "past" ? past : allBookings;

  const tabs: { key: Scope; label: string; count: number }[] = [
    { key: "upcoming", label: t("bookingsTable.upcoming"), count: upcoming.length },
    { key: "past", label: t("bookingsTable.past"), count: past.length },
    { key: "all", label: t("bookingsTable.all"), count: allBookings.length },
  ];

  return (
    <PageContent>
      <PageHeader title={t("bookingsTitle")} context={`${allBookings.length}`} actions={<AddRideButton />} />

      <div className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "upcoming" ? "/carrier/bookings" : `/carrier/bookings?scope=${tab.key}`}
              className={`flex items-center gap-[6px] border-b-2 pb-[10px] text-[14px] font-medium transition-colors duration-[.12s] ease-out ${
                scope === tab.key
                  ? "border-[var(--ink-primary)] text-[var(--ink-primary)]"
                  : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {tab.label}
              <span className="text-[13px] text-[var(--ink-muted)]">{tab.count}</span>
            </Link>
          ))}
        </div>
        <FilterButton label={tRoot("common.status")} />
      </div>

      {bookings.length === 0 ? (
        <p className="text-[13.5px] text-[var(--ink-secondary)]">—</p>
      ) : (
        <div role="table" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[var(--border-container)] bg-white">
          <div
            role="row"
            className="grid h-11 shrink-0 items-center gap-3 border-b border-[var(--border-hairline)] px-5"
            style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
          >
            <span role="columnheader" className={HEADER_CLASS}>{t("bookingsTable.route")}</span>
            <span role="columnheader" className={HEADER_CLASS}>{t("bookingsTable.dateTime")}</span>
            <span role="columnheader" className={`${HEADER_CLASS} text-right`}>{t("bookingsTable.passengers")}</span>
            <span role="columnheader" className={HEADER_CLASS}>{tRoot("common.status")}</span>
          </div>
          <div role="rowgroup" className="min-h-0 flex-1 overflow-y-auto">
            {bookings.map((booking) => {
              const departure = new Date(booking.departureAt);
              return (
                <Link
                  key={booking.id}
                  href={`/carrier/bookings/${booking.id}`}
                  role="row"
                  className="grid h-[68px] items-center gap-3 border-b border-[var(--border-hairline)] px-5 transition-colors duration-[.12s] ease-out last:border-b-0 hover:bg-[var(--bg-subtle)]"
                  style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
                >
                  <div role="cell" className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{formatRoute(booking)}</p>
                    <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientDisplayName(booking.client)}</p>
                  </div>
                  <div role="cell" className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{formatDate(departure)}</p>
                    <p className="truncate text-[13px] text-[var(--ink-secondary)]">{formatTime(departure)}</p>
                  </div>
                  <div role="cell" className="min-w-0 text-right text-[14px] text-[var(--ink-primary)]">
                    {booking.passengerCount}
                    {booking.vehicle ? <span className="text-[var(--ink-muted)]">/{booking.vehicle.seats}</span> : null}
                  </div>
                  <div role="cell" className="min-w-0">
                    <StatusDot
                      color={RIDE_STATUS_ACCENT[booking.status as keyof typeof RIDE_STATUS_ACCENT] ?? "#A1A1AA"}
                      label={tRoot(`carrier.calendar.legend.${booking.status}`)}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </PageContent>
  );
}
