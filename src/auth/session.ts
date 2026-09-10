import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./auth";

export async function requireSession(locale: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }
  return session;
}

const ROLE_HOME: Record<Role, string> = {
  CLIENT: "dashboard",
  CARRIER: "carrier/dashboard",
  ADMIN: "admin/carriers",
};

export async function requireRole(locale: string, role: Role) {
  const session = await requireSession(locale);
  if (session.user.role !== role) {
    redirect(`/${locale}/${ROLE_HOME[session.user.role]}`);
  }
  return session;
}
