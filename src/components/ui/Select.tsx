import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`h-[42px] w-full rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-3 text-[14px] text-[var(--ink-primary)] transition-[border-color,box-shadow] duration-[.12s] ease-out focus:outline-none focus:border-[#2563EB] focus:shadow-[var(--focus-ring)] ${className}`}
        {...props}
      />
    );
  },
);
