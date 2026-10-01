"use client";

// Compact 2(+)-option toggle — e.g. the Ruta section's Povratna/Jednosmerna
// switch. Purely a UI control: it reports the selected value, nothing more.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex h-8 items-center rounded-[8px] bg-[#F4F4F5] p-[3px] ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex h-full items-center rounded-[6px] px-3 text-[13px] font-medium transition-colors duration-[.12s] ease-out ${
              active
                ? "bg-white text-[#18181B] shadow-[0_1px_2px_rgba(24,24,27,.08),0_0_0_1px_rgba(24,24,27,.04)]"
                : "text-[#71717A]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
