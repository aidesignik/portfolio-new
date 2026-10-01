import { SelectHTMLAttributes, forwardRef } from "react";

const DEFAULT_CLASS =
  "h-[42px] w-full rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-3 text-[14px] text-[var(--ink-primary)] transition-[border-color,box-shadow] duration-[.12s] ease-out focus:outline-none focus:border-[#2563EB] focus:shadow-[var(--focus-ring)]";

// See Input.tsx's `unstyled` for why this exists.
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { unstyled?: boolean }
>(function Select({ className = "", unstyled = false, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`${unstyled ? "" : DEFAULT_CLASS} ${className}`}
      {...props}
    />
  );
});
