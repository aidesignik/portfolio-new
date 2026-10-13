import { PrismaClient, type VehicleAmenity, type VehicleType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { leastUsedDriverColor } from "../src/lib/driverAvatarAssignment";

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

// Fictional throughout: company/owner/driver names, tax IDs and phone
// numbers are all invented for client demos — phone numbers use Ofcom's
// reserved "drama" range (07700 900xxx) specifically so none of them can
// collide with a real subscriber.
const CARRIERS: CarrierSeed[] = [
  {
    email: "carrier@example.com",
    password: "carrier123",
    ownerName: "James Whitfield",
    companyName: "Capital Coachlines Ltd",
    taxId: "GB427193856",
    city: "London",
    phone: "+447700900123",
    ratePerKm: 2.4,
    fixedFee: 45,
    vehicle: { type: "COACH", model: "Mercedes-Benz Tourismo", year: 2022, seats: 53, amenities: ["AC", "WIFI", "USB", "TOILET"] },
    driverName: "Oliver Bennett",
    driverPhone: "+447700900124",
  },
  {
    email: "carrier2@example.com",
    password: "carrier123",
    ownerName: "Charlotte Hughes",
    companyName: "Northern Star Travel",
    taxId: "GB593841027",
    city: "Manchester",
    phone: "+447700900231",
    ratePerKm: 2.1,
    fixedFee: 35,
    vehicle: { type: "DOUBLE_DECKER", model: "Alexander Dennis Enviro400", year: 2020, seats: 85, amenities: ["AC", "WIFI"] },
    driverName: "Harry Thompson",
    driverPhone: "+447700900232",
  },
  {
    email: "carrier3@example.com",
    password: "carrier123",
    ownerName: "Fraser MacDonald",
    companyName: "Highland Executive Travel",
    taxId: "GB384726109",
    city: "Edinburgh",
    phone: "+447700900345",
    ratePerKm: 2.6,
    fixedFee: 55,
    vehicle: { type: "COACH", model: "Volvo 9700", year: 2019, seats: 49, amenities: ["AC", "USB", "TOILET"] },
    driverName: "Callum Stewart",
    driverPhone: "+447700900346",
  },
  {
    email: "carrier4@example.com",
    password: "carrier123",
    ownerName: "Emily Clarke",
    companyName: "West Country Minibus Hire",
    taxId: "GB168203947",
    city: "Bristol",
    phone: "+447700900458",
    ratePerKm: 1.7,
    fixedFee: 25,
    vehicle: { type: "MINIBUS", model: "Mercedes-Benz Sprinter", year: 2023, seats: 16, amenities: ["AC", "WIFI", "USB"] },
    driverName: "Jack Parker",
    driverPhone: "+447700900459",
  },
  {
    // GoogleSignInButton always signs in with this exact fixed identity
    // (see src/components/forms/GoogleSignInButton.tsx) — there's no real
    // Google OAuth wired up, so "Sign in with Google" on the login page
    // always lands on this one account. Needs its own seed entry so that
    // demo path shows the same quality of content as the email/password
    // logins instead of whatever got typed into it during earlier testing.
    email: "google.demo.carrier@example.com",
    password: "unused-google-mock-login",
    ownerName: "Demo Carrier (Google)",
    companyName: "Thameside Coach Travel",
    taxId: "GB719642058",
    city: "Birmingham",
    phone: "+447700900561",
    ratePerKm: 2.2,
    fixedFee: 40,
    vehicle: { type: "COACH", model: "Plaxton Elite", year: 2021, seats: 51, amenities: ["AC", "WIFI", "USB", "TOILET"] },
    driverName: "William Carter",
    driverPhone: "+447700900562",
  },
];

async function seedCarrier(spec: CarrierSeed) {
  const user = await prisma.user.upsert({
    where: { email: spec.email },
    update: { name: spec.ownerName },
    create: {
      email: spec.email,
      passwordHash: await bcrypt.hash(spec.password, 10),
      name: spec.ownerName,
      role: "CARRIER",
    },
  });

  // update (not {}) so re-running this script against an already-seeded
  // database refreshes demo content in place — e.g. swapping in new
  // carrier/vehicle/driver profiles for a client demo — instead of only
  // taking effect on a fresh database.
  const carrierData = {
    companyName: spec.companyName,
    taxId: spec.taxId,
    contactEmail: spec.email,
    contactPhone: spec.phone,
    city: spec.city,
    description: `Demo carrier for local development (${spec.companyName}).`,
    status: "APPROVED" as const,
    ratePerKm: spec.ratePerKm,
    fixedFee: spec.fixedFee,
  };
  const carrier = await prisma.carrier.upsert({
    where: { userId: user.id },
    update: carrierData,
    create: { userId: user.id, ...carrierData },
  });

  const vehicleData = {
    type: spec.vehicle.type,
    model: spec.vehicle.model,
    year: spec.vehicle.year,
    seats: spec.vehicle.seats,
    amenities: spec.vehicle.amenities,
    status: "ACTIVE" as const,
  };
  const existingVehicle = await prisma.vehicle.findFirst({ where: { carrierId: carrier.id } });
  const vehicle = existingVehicle
    ? await prisma.vehicle.update({ where: { id: existingVehicle.id }, data: vehicleData })
    : await prisma.vehicle.create({ data: { carrierId: carrier.id, ...vehicleData } });

  const driverData = { name: spec.driverName, phone: spec.driverPhone, isAvailable: true };
  const existingDriver = await prisma.driver.findFirst({ where: { carrierId: carrier.id } });
  const driver = existingDriver
    ? await prisma.driver.update({ where: { id: existingDriver.id }, data: driverData })
    : await prisma.driver.create({
        data: { carrierId: carrier.id, ...driverData, avatarColor: await leastUsedDriverColor(prisma, carrier.id) },
      });

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
