import { PrismaClient, type VehicleAmenity, type VehicleType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { leastUsedDriverColor } from "../src/lib/driverAvatarAssignment";
import { regenerateRideDocuments } from "@/lib/documents/regenerate";

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
];

// GoogleSignInButton always signs in with this exact fixed identity (see
// src/components/forms/GoogleSignInButton.tsx) — there's no real Google
// OAuth wired up, so "Sign in with Google" on the login page always lands
// on this one account. It gets its own richer seed (multiple vehicles,
// multiple drivers, a spread of rides across every status) rather than
// the single-vehicle CarrierSeed shape the other four use, since this is
// the account actually used for live client demonstrations — company
// name kept as "Transport team" by request, everything else refreshed.
const GOOGLE_DEMO_EMAIL = "google.demo.carrier@example.com";

const GOOGLE_DEMO_VEHICLES: Array<{
  type: VehicleType;
  model: string;
  year: number;
  seats: number;
  licensePlate: string;
  amenities: VehicleAmenity[];
}> = [
  { type: "COACH", model: "Plaxton Elite", year: 2021, seats: 51, licensePlate: "BM21 PLX", amenities: ["AC", "WIFI", "USB", "TOILET"] },
  { type: "MIDIBUS", model: "Alexander Dennis Enviro200", year: 2020, seats: 30, licensePlate: "BM20 ADE", amenities: ["AC", "WIFI"] },
  { type: "MINIBUS", model: "Mercedes-Benz Sprinter", year: 2023, seats: 16, licensePlate: "BM23 MBS", amenities: ["AC", "WIFI", "USB"] },
  { type: "VAN", model: "Ford Transit Custom", year: 2019, seats: 8, licensePlate: "BM19 FTC", amenities: ["AC"] },
];

const GOOGLE_DEMO_DRIVERS: Array<{ name: string; phone: string; licenseNumber: string }> = [
  { name: "William Carter", phone: "+447700900562", licenseNumber: "CARTE912256WC9AB" },
  { name: "Daniel Foster", phone: "+447700900563", licenseNumber: "FOSTE803127DF4CD" },
  { name: "George Mitchell", phone: "+447700900564", licenseNumber: "MITCH705098GM2EF" },
  { name: "Thomas Reid", phone: "+447700900565", licenseNumber: "REID9609014TR8GH" },
];

const GOOGLE_DEMO_CLIENTS: Array<{ email: string; name: string; companyName: string | null; phone: string }> = [
  { email: "sophie.bennett.demo@example.com", name: "Sophie Bennett", companyName: "Bright Events Ltd", phone: "+447700900601" },
  { email: "mark.ellison.demo@example.com", name: "Mark Ellison", companyName: "Oakwood Academy", phone: "+447700900602" },
  { email: "rachel.green.demo@example.com", name: "Rachel Green", companyName: null, phone: "+447700900603" },
];

// dayOffset is relative to whenever the seed actually runs, so "completed"
// rides always land in the past and "confirmed"/"cancelled" upcoming ones
// in the future, regardless of when a demo happens. vehicle/driver indices
// index into GOOGLE_DEMO_VEHICLES/GOOGLE_DEMO_DRIVERS, client into
// GOOGLE_DEMO_CLIENTS. returnDayOffset/returnHour, when set, make the ride
// a multi-day round trip (isRoundTrip + returnAt) — the calendar renders
// those as a single block spanning from departure day to return day.
const GOOGLE_DEMO_RIDES: Array<{
  pickupCity: string;
  pickupLocation: string;
  destinationCity: string;
  destinationLocation: string;
  dayOffset: number;
  hour: number;
  returnDayOffset?: number;
  returnHour?: number;
  passengerCount: number;
  price: number;
  // No literal "COMPLETED" here — displayRideStatus (src/lib/rideStatus.ts)
  // derives that from a CONFIRMED ride whose trip window has already
  // passed, exactly as the live app produces it. Writing COMPLETED
  // directly would desync these demo rides from that invariant and hide
  // UI that keys off the raw status, e.g. "Remove from calendar" in
  // RideDetailDrawer.
  status: "CONFIRMED" | "CANCELLED";
  vehicle: number;
  driver: number;
  client: number;
}> = [
  { pickupCity: "Birmingham", pickupLocation: "New Street Station", destinationCity: "Manchester", destinationLocation: "Piccadilly Gardens", dayOffset: -3, hour: 8, passengerCount: 45, price: 320, status: "CONFIRMED", vehicle: 0, driver: 0, client: 0 },
  { pickupCity: "Birmingham", pickupLocation: "Bullring", destinationCity: "London", destinationLocation: "Victoria Coach Station", dayOffset: -6, hour: 7, passengerCount: 14, price: 180, status: "CONFIRMED", vehicle: 2, driver: 2, client: 1 },
  { pickupCity: "Birmingham", pickupLocation: "Grand Central", destinationCity: "Bristol", destinationLocation: "Cabot Circus", dayOffset: 2, hour: 9, passengerCount: 28, price: 260, status: "CONFIRMED", vehicle: 1, driver: 1, client: 2 },
  { pickupCity: "Birmingham", pickupLocation: "New Street Station", destinationCity: "Edinburgh", destinationLocation: "Waverley Bridge", dayOffset: 4, hour: 6, passengerCount: 48, price: 540, status: "CONFIRMED", vehicle: 0, driver: 0, client: 0 },
  { pickupCity: "Birmingham", pickupLocation: "Selfridges", destinationCity: "Liverpool", destinationLocation: "Albert Dock", dayOffset: 1, hour: 10, passengerCount: 7, price: 95, status: "CANCELLED", vehicle: 3, driver: 3, client: 2 },
  { pickupCity: "Birmingham", pickupLocation: "Mailbox", destinationCity: "Nottingham", destinationLocation: "Old Market Square", dayOffset: -5, hour: 11, passengerCount: 12, price: 150, status: "CANCELLED", vehicle: 2, driver: 2, client: 1 },
  // Multi-day round trips — span several columns on the weekly calendar.
  { pickupCity: "Birmingham", pickupLocation: "New Street Station", destinationCity: "London", destinationLocation: "Victoria Coach Station", dayOffset: 0, hour: 7, returnDayOffset: 2, returnHour: 19, passengerCount: 42, price: 980, status: "CONFIRMED", vehicle: 0, driver: 0, client: 0 },
  { pickupCity: "Birmingham", pickupLocation: "Grand Central", destinationCity: "Edinburgh", destinationLocation: "Waverley Bridge", dayOffset: -1, hour: 6, returnDayOffset: 1, returnHour: 20, passengerCount: 47, price: 1150, status: "CONFIRMED", vehicle: 1, driver: 1, client: 1 },
  { pickupCity: "Birmingham", pickupLocation: "Mailbox", destinationCity: "Liverpool", destinationLocation: "Albert Dock", dayOffset: -2, hour: 8, returnDayOffset: -1, returnHour: 18, passengerCount: 29, price: 420, status: "CONFIRMED", vehicle: 2, driver: 2, client: 2 },
  { pickupCity: "Birmingham", pickupLocation: "Selfridges", destinationCity: "Nottingham", destinationLocation: "Old Market Square", dayOffset: 3, hour: 9, passengerCount: 15, price: 140, status: "CONFIRMED", vehicle: 3, driver: 3, client: 0 },
];

// Wipes everything under a carrier that the demo accounts above routinely
// pick up from manual testing through the UI (extra vehicles, extra
// drivers, old test rides with whatever cities were typed in at the time)
// so a re-seed always lands on exactly the one vehicle + one driver this
// file specifies — never a mix of fresh demo content alongside leftovers.
// Deletion order follows the FK chain (children before parents): a Ride's
// Documents/RideStops, then the Ride itself, then Blocks, then the
// Driver<->Vehicle links, and finally the vehicles/drivers themselves.
async function resetCarrierFleet(carrierId: string) {
  const rides = await prisma.ride.findMany({ where: { carrierId }, select: { id: true } });
  const rideIds = rides.map((r) => r.id);
  if (rideIds.length > 0) {
    await prisma.document.deleteMany({ where: { rideId: { in: rideIds } } });
    await prisma.rideStop.deleteMany({ where: { rideId: { in: rideIds } } });
    await prisma.ride.deleteMany({ where: { id: { in: rideIds } } });
  }
  await prisma.block.deleteMany({ where: { carrierId } });
  await prisma.driverVehicle.deleteMany({ where: { driver: { carrierId } } });
  await prisma.vehicle.deleteMany({ where: { carrierId } });
  await prisma.driver.deleteMany({ where: { carrierId } });
}

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

  await resetCarrierFleet(carrier.id);

  const vehicle = await prisma.vehicle.create({
    data: {
      carrierId: carrier.id,
      type: spec.vehicle.type,
      model: spec.vehicle.model,
      year: spec.vehicle.year,
      seats: spec.vehicle.seats,
      amenities: spec.vehicle.amenities,
      status: "ACTIVE",
    },
  });

  const driver = await prisma.driver.create({
    data: {
      carrierId: carrier.id,
      name: spec.driverName,
      phone: spec.driverPhone,
      isAvailable: true,
      avatarColor: await leastUsedDriverColor(prisma, carrier.id),
    },
  });

  await prisma.driverVehicle.create({ data: { driverId: driver.id, vehicleId: vehicle.id } });

  console.log(`Carrier ready: ${spec.companyName} — ${spec.email} / ${spec.password}`);
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function seedGoogleDemoCarrier() {
  const user = await prisma.user.upsert({
    where: { email: GOOGLE_DEMO_EMAIL },
    update: { name: "Demo Carrier (Google)" },
    create: {
      email: GOOGLE_DEMO_EMAIL,
      passwordHash: await bcrypt.hash("unused-google-mock-login", 10),
      name: "Demo Carrier (Google)",
      role: "CARRIER",
    },
  });

  const carrierData = {
    companyName: "Transport team",
    taxId: "GB719642058",
    contactEmail: GOOGLE_DEMO_EMAIL,
    contactPhone: "+447700900561",
    city: "Birmingham",
    description: "Demo carrier for local development (Transport team).",
    status: "APPROVED" as const,
    ratePerKm: 2.2,
    fixedFee: 40,
  };
  const carrier = await prisma.carrier.upsert({
    where: { userId: user.id },
    update: carrierData,
    create: { userId: user.id, ...carrierData },
  });

  await resetCarrierFleet(carrier.id);

  const vehicles = [];
  for (const spec of GOOGLE_DEMO_VEHICLES) {
    vehicles.push(
      await prisma.vehicle.create({
        data: {
          carrierId: carrier.id,
          type: spec.type,
          model: spec.model,
          year: spec.year,
          seats: spec.seats,
          licensePlate: spec.licensePlate,
          amenities: spec.amenities,
          status: "ACTIVE",
        },
      }),
    );
  }

  const drivers = [];
  for (const spec of GOOGLE_DEMO_DRIVERS) {
    const driver = await prisma.driver.create({
      data: {
        carrierId: carrier.id,
        name: spec.name,
        phone: spec.phone,
        licenseNumber: spec.licenseNumber,
        isAvailable: true,
        avatarColor: await leastUsedDriverColor(prisma, carrier.id),
      },
    });
    drivers.push(driver);
  }
  // Each driver is paired with the vehicle at the same index — a plain 1:1
  // starting fleet, same as the other four demo carriers.
  for (let i = 0; i < drivers.length; i++) {
    await prisma.driverVehicle.create({ data: { driverId: drivers[i].id, vehicleId: vehicles[i].id } });
  }

  // Upserted (not reset) — these are shared "customer" identities, not
  // part of this carrier's own fleet, so a re-seed shouldn't delete and
  // recreate them (that would also orphan any rides already pointing at
  // them via a required, non-cascading clientId).
  const clients = [];
  for (const spec of GOOGLE_DEMO_CLIENTS) {
    clients.push(
      await prisma.user.upsert({
        where: { email: spec.email },
        update: { name: spec.name, companyName: spec.companyName, phone: spec.phone },
        create: {
          email: spec.email,
          passwordHash: await bcrypt.hash("demo-client-unused", 10),
          name: spec.name,
          companyName: spec.companyName,
          phone: spec.phone,
          role: "CLIENT",
        },
      }),
    );
  }

  const now = new Date();
  for (const spec of GOOGLE_DEMO_RIDES) {
    const departureAt = new Date(now.getTime() + spec.dayOffset * DAY_MS);
    departureAt.setHours(spec.hour, 0, 0, 0);

    let returnAt: Date | undefined;
    if (spec.returnDayOffset !== undefined) {
      returnAt = new Date(now.getTime() + spec.returnDayOffset * DAY_MS);
      returnAt.setHours(spec.returnHour ?? spec.hour, 0, 0, 0);
    }

    const ride = await prisma.ride.create({
      data: {
        clientId: clients[spec.client].id,
        carrierId: carrier.id,
        vehicleId: vehicles[spec.vehicle].id,
        driverId: drivers[spec.driver].id,
        pickupCity: spec.pickupCity,
        pickupLocation: spec.pickupLocation,
        destinationCity: spec.destinationCity,
        destinationLocation: spec.destinationLocation,
        departureAt,
        isRoundTrip: returnAt !== undefined,
        returnAt,
        passengerCount: spec.passengerCount,
        price: spec.price,
        currency: "GBP",
        status: spec.status,
      },
    });
    // Mirrors what the app itself does once a ride has vehicle + driver +
    // price (see regenerateRideDocuments) — generates the actual
    // CONFIRMATION/CONTRACT/INVOICE PDFs so the demo has real documents
    // to open, not just rows claiming to have some.
    await regenerateRideDocuments(ride.id);
  }

  console.log(
    `Carrier ready: Transport team (Google sign-in) — ${GOOGLE_DEMO_EMAIL} — ${vehicles.length} vehicles, ${drivers.length} drivers, ${GOOGLE_DEMO_RIDES.length} rides`,
  );
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
  await seedGoogleDemoCarrier();

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
