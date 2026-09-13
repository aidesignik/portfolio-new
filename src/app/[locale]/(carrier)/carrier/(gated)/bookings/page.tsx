import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatRoute } from "@/lib/location";

export default async function CarrierBookingsPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("carrier")]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const bookings = await prisma.ride.findMany({
    where: { carrierId: carrier.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("bookingsTitle")}</h1>
        <Link href="/carrier/bookings/new">
          <Button>{t("addRide")}</Button>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-zinc-600">—</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/carrier/bookings/${booking.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <p className="font-medium text-zinc-900">{formatRoute(booking)}</p>
                  <p className="text-sm text-zinc-600">
                    {new Date(booking.departureAt).toLocaleString()} · {booking.client.name}
                  </p>
                </div>
                <Badge tone="positive">{booking.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
