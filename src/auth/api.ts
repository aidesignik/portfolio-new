import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "./auth";

export async function requireApiRole(role: Role) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  }
  if (session.user.role !== role) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const;
  }
  return { session } as const;
}
