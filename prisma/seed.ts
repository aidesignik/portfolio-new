import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`Admin user ready: ${adminEmail} / ${adminPassword}`);

  const carrierEmail = "carrier@example.com";
  const carrierPassword = "carrier123";

  const carrierUser = await prisma.user.upsert({
    where: { email: carrierEmail },
    update: {},
    create: {
      email: carrierEmail,
      passwordHash: await bcrypt.hash(carrierPassword, 10),
      name: "Demo Carrier Owner",
      role: "CARRIER",
    },
  });

  const carrier = await prisma.carrier.upsert({
    where: { userId: carrierUser.id },
    update: {},
    create: {
      userId: carrierUser.id,
      companyName: "Atlas Bus d.o.o.",
      taxId: "123456789",
      contactEmail: carrierEmail,
      contactPhone: "+381601234567",
      city: "Belgrade",
      description: "Demo carrier for local development.",
      status: "APPROVED",
      ratePerKm: 120,
      fixedFee: 1500,
    },
  });
  console.log(`Demo carrier ready: ${carrierEmail} / ${carrierPassword}`);

  const existingVehicle = await prisma.vehicle.findFirst({ where: { carrierId: carrier.id } });
  const vehicle =
    existingVehicle ??
    (await prisma.vehicle.create({
      data: {
        carrierId: carrier.id,
        make: "Mercedes-Benz",
        model: "Tourismo",
        year: 2019,
        seats: 50,
        amenities: ["AC", "WIFI", "USB", "TOILET"],
        status: "ACTIVE",
      },
    }));

  const existingDriver = await prisma.driver.findFirst({ where: { carrierId: carrier.id } });
  const driver =
    existingDriver ??
    (await prisma.driver.create({
      data: {
        carrierId: carrier.id,
        name: "Marko Marković",
        phone: "+381641234567",
        isAvailable: true,
      },
    }));

  await prisma.driverVehicle.upsert({
    where: { driverId_vehicleId: { driverId: driver.id, vehicleId: vehicle.id } },
    update: {},
    create: { driverId: driver.id, vehicleId: vehicle.id },
  });

  const clientEmail = "client@example.com";
  const clientPassword = "client123";
  await prisma.user.upsert({
    where: { email: clientEmail },
    update: {},
    create: {
      email: clientEmail,
      passwordHash: await bcrypt.hash(clientPassword, 10),
      name: "Demo Client",
      role: "CLIENT",
    },
  });
  console.log(`Demo client ready: ${clientEmail} / ${clientPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
