import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-[42px] w-full rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-3 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-disabled)] transition-[border-color,box-shadow] duration-[.12s] ease-out focus:outline-none focus:border-[#2563EB] focus:shadow-[var(--focus-ring)] ${className}`}
      {...props}
    />
  );
});
