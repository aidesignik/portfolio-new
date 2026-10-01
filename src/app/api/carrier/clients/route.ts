import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

// Lets the "New ride" form autofill contact details once a carrier starts
// typing a client/company name they've booked for before — scoped to
// clients who actually have a ride with this carrier, not the whole
// platform, since a client's email/phone shouldn't be look-up-able by a
// carrier they've never worked with.
export async function GET(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ clients: [] });
  }

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      rides: { some: { carrierId: carrier.id } },
      OR: [
        { companyName: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, companyName: true, name: true, email: true, phone: true },
    take: 8,
  });

  return NextResponse.json({ clients });
}
