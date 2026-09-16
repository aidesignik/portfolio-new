"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({
  label,
  className = "text-sm font-medium text-zinc-700 hover:text-zinc-900",
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      {label}
    </button>
  );
}
