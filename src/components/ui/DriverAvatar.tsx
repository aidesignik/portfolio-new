const PASTELS = [
  { bg: "#DBE6FE", ink: "#1E40AF" },
  { bg: "#FBD8FE", ink: "#86198F" },
  { bg: "#FFEDD5", ink: "#9A3412" },
  { bg: "#DCFCE7", ink: "#166534" },
];

const SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-[34px] w-[34px] text-[12px]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pastelFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PASTELS[hash % PASTELS.length];
}

// Circular identity treatment for drivers — the opposite shape from
// VehicleAvatar's rounded-square so the two entity kinds are distinguishable
// at a glance wherever they appear side by side. The filled name goes in
// `title` only (per the design system, an assigned-driver avatar carries no
// visible label) — callers that have room for a name render it separately.
export function DriverAvatar({
  name,
  photoUrl,
  size = "md",
  id,
  empty = false,
}: {
  name?: string;
  photoUrl?: string | null;
  size?: "sm" | "md";
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

  const { bg, ink } = pastelFor(id ?? name);
  return (
    <div
      title={name}
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full font-medium`}
      style={{ background: bg, color: ink }}
    >
      {initials(name)}
    </div>
  );
}
