"use client";

import type { KeyboardEvent } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton({
  label,
  className = "text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink-primary)]",
  role,
  itemRef,
  onKeyDown,
}: {
  label: string;
  className?: string;
  role?: string;
  itemRef?: (el: HTMLButtonElement | null) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      ref={itemRef}
      type="button"
      role={role}
      onKeyDown={onKeyDown}
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className}
    >
      {label}
    </button>
  );
}
