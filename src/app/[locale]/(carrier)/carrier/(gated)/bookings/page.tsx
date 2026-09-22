import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";
import { PageHeader } from "@/components/carrier/PageHeader";

export default async function CarrierBookingsPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("carrier")]);
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
        actions={
          <Link href="/carrier/bookings/new">
            <Button>{t("addRide")}</Button>
          </Link>
        }
      />
      <div className="px-5 py-4">
        {bookings.length === 0 ? (
          <p className="text-[13.5px] text-[var(--ink-muted)]">—</p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/carrier/bookings/${booking.id}`}
                className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-[14px] transition-colors duration-[.12s] ease-out last:border-b-0 hover:bg-[var(--bg-subtle)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-bold text-[var(--ink-primary)]">{formatRoute(booking)}</p>
                  <p className="truncate text-[13.5px] text-[var(--ink-secondary)]">
                    {new Date(booking.departureAt).toLocaleString()} · {clientDisplayName(booking.client)}
                  </p>
                </div>
                <Badge tone="positive">{booking.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
