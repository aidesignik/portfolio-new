import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function CalendarPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("carrier")]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const bookings = await prisma.booking.findMany({
    where: { carrierId: carrier.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    include: { vehicle: true, driver: true, request: true, client: { select: { name: true } } },
    orderBy: { request: { departureAt: "asc" } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("calendarTitle")}</h1>

      {bookings.length === 0 ? (
        <p className="text-sm text-zinc-600">—</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">
                  {new Date(booking.request.departureAt).toLocaleString()}
                </p>
                <p className="text-sm text-zinc-600">
                  {booking.request.pickupAddress} → {booking.request.destinationAddress}
                </p>
                <p className="text-xs text-zinc-500">
                  {booking.vehicle.make} {booking.vehicle.model} · {booking.driver.name} · {booking.client.name}
                </p>
              </div>
              <Badge tone="positive">{booking.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
