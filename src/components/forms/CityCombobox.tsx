"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { COMMON_CITIES } from "@/lib/location";

export function CityCombobox({
  value,
  onChange,
  required,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = query
    ? COMMON_CITIES.filter((city) => city.toLowerCase().includes(query))
    : COMMON_CITIES;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        required={required}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 ? (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg">
          {filtered.map((city) => (
            <li key={city}>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-zinc-700 hover:bg-zinc-100"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
