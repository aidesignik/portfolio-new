import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-[var(--action-bg)] text-white hover:bg-[var(--action-bg-hover)]",
  secondary:
    "bg-[var(--bg-panel)] text-[var(--ink-strong)] border border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]",
  danger: "bg-[var(--accent-expired)] text-white hover:brightness-95",
  ghost: "bg-transparent text-[var(--ink-2)] hover:bg-[var(--border-soft)]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; compact?: boolean }
>(function Button({ className = "", variant = "primary", compact = false, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-semibold transition-[background-color,border-color,box-shadow] duration-[.12s] ease-out disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:shadow-[var(--focus-ring)] ${
        compact ? "h-10" : "h-11"
      } ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});
