import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth.schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  if (data.role === "CLIENT") {
    await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: "CLIENT",
      },
    });
  } else {
    const taxIdInUse = await prisma.carrier.findUnique({ where: { taxId: data.taxId } });
    if (taxIdInUse) {
      return NextResponse.json({ error: "TAX_ID_IN_USE" }, { status: 409 });
    }

    await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: "CARRIER",
        carrier: {
          create: {
            companyName: data.companyName,
            taxId: data.taxId,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            city: data.city,
            description: data.description,
            licenseInfo: data.licenseInfo,
            status: "PENDING",
          },
        },
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
