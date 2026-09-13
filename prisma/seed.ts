import { PrismaClient, type VehicleAmenity, type VehicleType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface CarrierSeed {
  email: string;
  password: string;
  ownerName: string;
  companyName: string;
  taxId: string;
  city: string;
  phone: string;
  ratePerKm: number;
  fixedFee: number;
  vehicle: {
    type: VehicleType;
    model: string;
    year: number;
    seats: number;
    amenities: VehicleAmenity[];
  };
  driverName: string;
  driverPhone: string;
}

const CARRIERS: CarrierSeed[] = [
  {
    email: "carrier@example.com",
    password: "carrier123",
    ownerName: "Demo Carrier Owner",
    companyName: "Atlas Bus d.o.o.",
    taxId: "123456789",
    city: "Belgrade",
    phone: "+381601234567",
    ratePerKm: 120,
    fixedFee: 1500,
    vehicle: { type: "COACH", model: "Tourismo", year: 2019, seats: 50, amenities: ["AC", "WIFI", "USB", "TOILET"] },
    driverName: "Marko Marković",
    driverPhone: "+381641234567",
  },
  {
    email: "carrier2@example.com",
    password: "carrier123",
    ownerName: "Balkan Express Owner",
    companyName: "Balkan Express",
    taxId: "223456789",
    city: "Novi Sad",
    phone: "+381602345678",
    ratePerKm: 110,
    fixedFee: 1200,
    vehicle: { type: "COACH", model: "S 415", year: 2021, seats: 55, amenities: ["AC", "WIFI"] },
    driverName: "Nikola Nikolić",
    driverPhone: "+381642345678",
  },
  {
    email: "carrier3@example.com",
    password: "carrier123",
    ownerName: "Panorama Tours Owner",
    companyName: "Panorama Tours",
    taxId: "323456789",
    city: "Niš",
    phone: "+381603456789",
    ratePerKm: 130,
    fixedFee: 2000,
    vehicle: { type: "COACH", model: "Lion's Coach", year: 2018, seats: 48, amenities: ["AC", "USB", "TOILET"] },
    driverName: "Petar Petrović",
    driverPhone: "+381643456789",
  },
  {
    email: "carrier4@example.com",
    password: "carrier123",
    ownerName: "Via Express Owner",
    companyName: "Via Express",
    taxId: "423456789",
    city: "Kragujevac",
    phone: "+381604567890",
    ratePerKm: 90,
    fixedFee: 1000,
    vehicle: { type: "MIDIBUS", model: "Sprinter", year: 2022, seats: 20, amenities: ["AC", "WIFI", "USB"] },
    driverName: "Stefan Stefanović",
    driverPhone: "+381644567890",
  },
];

async function seedCarrier(spec: CarrierSeed) {
  const user = await prisma.user.upsert({
    where: { email: spec.email },
    update: {},
    create: {
      email: spec.email,
      passwordHash: await bcrypt.hash(spec.password, 10),
      name: spec.ownerName,
      role: "CARRIER",
    },
  });

  const carrier = await prisma.carrier.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: spec.companyName,
      taxId: spec.taxId,
      contactEmail: spec.email,
      contactPhone: spec.phone,
      city: spec.city,
      description: `Demo carrier for local development (${spec.companyName}).`,
      status: "APPROVED",
      ratePerKm: spec.ratePerKm,
      fixedFee: spec.fixedFee,
    },
  });

  const vehicle =
    (await prisma.vehicle.findFirst({ where: { carrierId: carrier.id } })) ??
    (await prisma.vehicle.create({
      data: {
        carrierId: carrier.id,
        type: spec.vehicle.type,
        model: spec.vehicle.model,
        year: spec.vehicle.year,
        seats: spec.vehicle.seats,
        amenities: spec.vehicle.amenities,
        status: "ACTIVE",
      },
    }));

  const driver =
    (await prisma.driver.findFirst({ where: { carrierId: carrier.id } })) ??
    (await prisma.driver.create({
      data: {
        carrierId: carrier.id,
        name: spec.driverName,
        phone: spec.driverPhone,
        isAvailable: true,
      },
    }));

  await prisma.driverVehicle.upsert({
    where: { driverId_vehicleId: { driverId: driver.id, vehicleId: vehicle.id } },
    update: {},
    create: { driverId: driver.id, vehicleId: vehicle.id },
  });

  console.log(`Carrier ready: ${spec.companyName} — ${spec.email} / ${spec.password}`);
}

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

  for (const spec of CARRIERS) {
    await seedCarrier(spec);
  }

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
