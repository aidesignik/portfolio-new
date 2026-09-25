export function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[7px] text-[14px] text-[#27272B]">
      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
