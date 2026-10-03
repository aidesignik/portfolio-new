const SIZE_CLASSES: Record<"xs" | "sm" | "md", string> = {
  xs: "h-6 w-6 text-[10.5px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-[34px] w-[34px] text-[12px]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Circular identity treatment for drivers — the opposite shape from
// VehicleAvatar's rounded-square so the two entity kinds are distinguishable
// at a glance wherever they appear side by side. The filled name goes in
// `title` only (per the design system, an assigned-driver avatar carries no
// visible label) — callers that have room for a name render it separately.
// Neutral grey fill everywhere: per the "color only for problems" design
// principle, an avatar's own color carries no meaning, so it doesn't vary
// by driver.
export function DriverAvatar({
  name,
  photoUrl,
  size = "md",
  id: _id,
  empty = false,
}: {
  name?: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md";
  id?: string;
  empty?: boolean;
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

  return (
    <div
      title={name}
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-[#ECECEC] font-semibold text-[#3F3F46]`}
    >
      {initials(name)}
    </div>
  );
}
