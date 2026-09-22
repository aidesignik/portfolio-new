import type { ReactNode } from "react";
import { requireRole } from "@/auth/session";

export default async function CarrierLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "CARRIER");
  return <>{children}</>;
}
