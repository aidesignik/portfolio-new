import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";

export default async function ClientBookingsPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("client")]);
  const bookings = await prisma.booking.findMany({
    where: { clientId: session!.user.id },
    include: { request: true, carrier: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("myBookings")}</h1>

      {bookings.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("noBookings")}</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <p className="font-medium text-zinc-900">
                    {booking.request.pickupAddress} → {booking.request.destinationAddress}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {new Date(booking.request.departureAt).toLocaleString()} · {booking.carrier.companyName}
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
