"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";

// A table row that's clickable in full (navigates to the edit page) with at
// most one nested interactive element (the row-actions "···" menu) — cells
// that hold their own controls stop propagation so they don't also trigger
// the row's own navigation.
export function ClickableRow({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div
      role="row"
      onClick={() => router.push(href)}
      className={`cursor-pointer transition-colors duration-[.12s] ease-out hover:bg-[var(--bg-subtle)] ${className}`}
    >
      {children}
    </div>
  );
}
