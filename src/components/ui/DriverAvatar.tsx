const SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Circular identity treatment for drivers — deliberately the opposite shape
// from VehicleAvatar's rounded-square so the two entity kinds are
// distinguishable at a glance wherever they appear side by side.
export function DriverAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md";
}) {
  const dims = SIZE_CLASSES[size];
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={name} className={`${dims} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-700`}
    >
      {initials(name)}
    </div>
  );
}
