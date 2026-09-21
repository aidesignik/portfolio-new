const SIZE_CLASSES: Record<"sm" | "md", { box: string; glyph: string }> = {
  sm: { box: "h-7 w-7", glyph: "h-4 w-4" },
  md: { box: "h-10 w-10", glyph: "h-5 w-5" },
};

const GLYPH_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Simple line-art silhouettes, varied a little by vehicle type — a van gets
// a shorter, single-box body, a double-decker gets two rows of windows, and
// everything else (minibus/midibus/coach) gets one consistent bus glyph
// with a window count that grows with vehicle size.
function VehicleGlyph({ type, className }: { type: string; className?: string }) {
  if (type === "VAN") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...GLYPH_PROPS}>
        <path d="M3 16V9.5a1 1 0 0 1 .4-.8L7 6h9l3.6 2.7a1 1 0 0 1 .4.8V16" />
        <line x1="3" y1="16" x2="21" y2="16" />
        <line x1="9" y1="6" x2="9" y2="12" />
        <line x1="5" y1="9" x2="19" y2="9" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </svg>
    );
  }

  if (type === "DOUBLE_DECKER") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...GLYPH_PROPS}>
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="6" y1="5.5" x2="6" y2="8" />
        <line x1="10" y1="5.5" x2="10" y2="8" />
        <line x1="14" y1="5.5" x2="14" y2="8" />
        <line x1="18" y1="5.5" x2="18" y2="8" />
        <line x1="6" y1="12" x2="6" y2="14.5" />
        <line x1="10" y1="12" x2="10" y2="14.5" />
        <line x1="14" y1="12" x2="14" y2="14.5" />
        <line x1="18" y1="12" x2="18" y2="14.5" />
        <line x1="3" y1="17" x2="21" y2="17" />
        <circle cx="7" cy="19.5" r="1.4" />
        <circle cx="17" cy="19.5" r="1.4" />
      </svg>
    );
  }

  const windowCount = type === "COACH" ? 5 : type === "MIDIBUS" ? 4 : 3;
  return (
    <svg viewBox="0 0 24 24" className={className} {...GLYPH_PROPS}>
      <rect x="2.5" y="5" width="19" height="10.5" rx="2" />
      <line x1="2.5" y1="11" x2="21.5" y2="11" />
      {Array.from({ length: windowCount }).map((_, i) => {
        const x = 5 + i * (14 / Math.max(windowCount - 1, 1));
        return <line key={i} x1={x} y1="7" x2={x} y2="9.5" />;
      })}
      <line x1="2.5" y1="15.5" x2="21.5" y2="15.5" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

// Rounded-square identity treatment for vehicles — deliberately the
// opposite shape from DriverAvatar's circle so the two entity kinds read
// apart at a glance wherever they appear side by side.
export function VehicleAvatar({
  type,
  photoUrl,
  size = "md",
}: {
  type: string;
  photoUrl?: string | null;
  size?: "sm" | "md";
}) {
  const dims = SIZE_CLASSES[size];
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" className={`${dims.box} shrink-0 rounded-md object-cover`} />;
  }
  return (
    <div
      className={`flex ${dims.box} shrink-0 items-center justify-center rounded-md bg-zinc-200 text-zinc-600`}
    >
      <VehicleGlyph type={type} className={dims.glyph} />
    </div>
  );
}
