import { Bus, BusFront, Truck, Van } from "lucide-react";

const GLYPH_BY_TYPE: Record<string, typeof Bus> = {
  COACH: Bus,
  MIDIBUS: Bus,
  DOUBLE_DECKER: BusFront,
  MINIBUS: Truck,
  VAN: Van,
};

const SIZE = {
  md: { box: "h-9 w-9", icon: 21 },
  sm: { box: "h-8 w-8", icon: 19 },
} as const;

// Rounded-square identity treatment for vehicles — the opposite shape from
// DriverAvatar's circle so the two entity kinds read apart at a glance
// wherever they appear side by side.
export function VehicleAvatar({
  type,
  typeLabel,
  photoUrl,
  size = "md",
  empty = false,
}: {
  type?: string;
  typeLabel?: string;
  photoUrl?: string | null;
  size?: "sm" | "md";
  empty?: boolean;
}) {
  const dims = SIZE[size];

  if (empty || !type) {
    return (
      <div
        title="No vehicle assigned"
        className={`flex ${dims.box} shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[var(--border-strong)] text-[var(--ink-disabled)]`}
      >
        –
      </div>
    );
  }

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        title={typeLabel}
        className={`${dims.box} shrink-0 rounded-[10px] object-cover`}
      />
    );
  }

  const Glyph = GLYPH_BY_TYPE[type] ?? Bus;
  return (
    <div
      title={typeLabel}
      className={`flex ${dims.box} shrink-0 items-center justify-center rounded-[10px] border border-[var(--border-hairline)]`}
    >
      <Glyph size={dims.icon} strokeWidth={1.9} color="#3F3F46" />
    </div>
  );
}
