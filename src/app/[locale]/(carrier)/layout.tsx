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
  return <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>;
}
