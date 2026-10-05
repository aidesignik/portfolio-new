const SIZE_CLASSES: Record<"2xs" | "xs" | "sm" | "md", string> = {
  "2xs": "h-5 w-5 text-[9.5px]",
  xs: "h-6 w-6 text-[10.5px]",
  sm: "h-[26px] w-[26px] text-[11px]",
  md: "h-[34px] w-[34px] text-[12px]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Palette for the `colorful` variant (calendar ride cards): a stable hash
// of the driver's id picks one of these 8, so the same driver always gets
// the same color everywhere a colorful avatar is shown.
const DRIVER_COLORS = [
  "#5B5BD6", // indigo
  "#3F7D6E", // sage
  "#B5543A", // terracotta
  "#8E4A8C", // plum
  "#4A6A8A", // slate blue
  "#9A6B1F", // ochre
  "#C2416B", // raspberry
  "#5E7A3A", // olive
];

function driverColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return DRIVER_COLORS[hash % DRIVER_COLORS.length];
}

// Circular identity treatment for drivers — the opposite shape from
// VehicleAvatar's rounded-square so the two entity kinds are distinguishable
// at a glance wherever they appear side by side. The filled name goes in
// `title` only (per the design system, an assigned-driver avatar carries no
// visible label) — callers that have room for a name render it separately.
// Colored by default (a stable per-driver hash into DRIVER_COLORS), so the
// same driver reads as the same color everywhere they're shown — fleet/
// driver tables, the ride detail drawer, and calendar ride cards alike.
// `colorful={false}` is kept as an opt-out for a context that wants the
// flat neutral-grey fill instead (none currently does).
export function DriverAvatar({
  name,
  photoUrl,
  size = "md",
  id,
  empty = false,
  colorful = true,
  ringColor = "#FFFFFF",
}: {
  name?: string;
  photoUrl?: string | null;
  size?: "2xs" | "xs" | "sm" | "md";
  id?: string;
  empty?: boolean;
  colorful?: boolean;
  // The colorful variant's 2px ring — defaults to white, but a caller
  // placing the avatar on a tinted surface (e.g. a status-tinted booking
  // card) can match that tint instead so the ring doesn't look like a
  // mismatched white halo.
  ringColor?: string;
}) {
  const dims = SIZE_CLASSES[size];

  if (empty || !name) {
    return (
      <div
        title="No driver assigned"
        className={`flex ${dims} shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--border-strong)] text-[var(--ink-disabled)]`}
      >
        –
      </div>
    );
  }

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" title={name} className={`${dims} shrink-0 rounded-full object-cover`} />;
  }

  if (colorful) {
    return (
      <div
        title={name}
        className={`flex ${dims} shrink-0 items-center justify-center rounded-full font-normal text-white`}
        style={{ background: driverColor(id ?? name), letterSpacing: "0.02em", boxShadow: `0 0 0 2px ${ringColor}` }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      title={name}
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-[#ECECEC] font-semibold text-[#3F3F46]`}
    >
      {initials(name)}
    </div>
  );
}
