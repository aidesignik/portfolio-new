import { ComponentPropsWithoutRef } from "react";

export function Card({
  children,
  className = "",
  bordered = true,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { bordered?: boolean }) {
  return (
    <div
      className={`rounded-[12px] bg-[var(--bg-panel)] p-6 ${bordered ? "border border-[var(--border-hairline)]" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
