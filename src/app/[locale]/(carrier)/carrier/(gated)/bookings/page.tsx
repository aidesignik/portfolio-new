import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/carrier/PageHeader";
import { PageContent } from "@/components/carrier/PageContent";
import { FilterButton } from "@/components/carrier/FilterButton";
import { AddRideButton } from "@/components/forms/AddRideButton";
import { BookingsTable } from "@/components/carrier/BookingsTable";
import { STOPS_INCLUDE, splitLegs } from "@/lib/rideStopsShape";
import type { CalendarRide } from "@/components/calendar/types";

type Scope = "upcoming" | "past" | "all";
type SearchParams = Record<string, string | string[] | undefined>;

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
  const [allBookings, vehicles, drivers] = await Promise.all([
    prisma.ride.findMany({
      where: { carrierId: carrier.id },
      include: { client: { select: { name: true, companyName: true, phone: true } }, stops: STOPS_INCLUDE },
      orderBy: { departureAt: "desc" },
    }),
    prisma.vehicle.findMany({ where: { carrierId: carrier.id } }),
    prisma.driver.findMany({ where: { carrierId: carrier.id } }),
  ]);

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
        <BookingsTable
          bookings={bookings.map(splitLegs).map(
            (b): CalendarRide => ({
              ...b,
              departureAt: b.departureAt.toISOString(),
              returnAt: b.returnAt ? b.returnAt.toISOString() : null,
              price: b.price !== null ? b.price.toString() : null,
            }),
          )}
          vehicles={vehicles}
          drivers={drivers}
        />
      )}
    </PageContent>
  );
}
