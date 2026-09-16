import { ComponentPropsWithoutRef } from "react";

export function Card({
  children,
  className = "",
  bordered = true,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { bordered?: boolean }) {
  return (
    <div
      className={`rounded-lg bg-white p-6 shadow-sm ${bordered ? "border border-zinc-200" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
