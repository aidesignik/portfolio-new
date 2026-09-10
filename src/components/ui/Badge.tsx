const colorByTone: Record<string, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  negative: "bg-red-100 text-red-700",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorByTone[tone]}`}
    >
      {children}
    </span>
  );
}
