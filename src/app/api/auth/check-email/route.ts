import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({ email: z.string().email() });

// Backs the email-first auth screen: lets the client find out, before the
// user types a password, whether they're logging into an existing account
// or creating a new one — so the single form can show the right copy
// without the user ever picking "login" vs "register" themselves.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ email: searchParams.get("email") });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });

  return NextResponse.json({ exists: Boolean(user) });
}
