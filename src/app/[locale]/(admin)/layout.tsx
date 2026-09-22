import type { ReactNode } from "react";
import { requireRole } from "@/auth/session";
import { Navbar } from "@/components/layout/Navbar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "ADMIN");
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
    </>
  );
}
