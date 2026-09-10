import { notFound } from "next/navigation";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { VehicleForm } from "@/components/forms/VehicleForm";
import { DeleteButton } from "@/components/forms/DeleteButton";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const session = await auth();
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, carrierId: carrier.id } });

  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {vehicle.make} {vehicle.model}
        </h1>
        <DeleteButton url={`/api/carrier/vehicles/${vehicle.id}`} redirectTo="/carrier/fleet" />
      </div>
      <Card>
        <VehicleForm
          vehicleId={vehicle.id}
          initial={{
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            seats: vehicle.seats,
            amenities: vehicle.amenities,
            status: vehicle.status,
          }}
        />
      </Card>
    </div>
  );
}
