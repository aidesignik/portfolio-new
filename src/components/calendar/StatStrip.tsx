import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface StatTile {
  href: string;
  label: string;
  count: number;
  addHref?: string;
  addLabel?: string;
}

export function StatStrip({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.href}
          className="flex items-center justify-between gap-2 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-3"
        >
          <Link href={tile.href} className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-[var(--ink-muted)]">{tile.label}</p>
            <p className="text-[24px] font-extrabold tracking-[-0.02em] text-[var(--ink-primary)]">{tile.count}</p>
          </Link>
          {tile.addHref ? (
            <Link
              href={tile.addHref}
              aria-label={tile.addLabel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[var(--border-hairline)] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--bg-subtle)]"
            >
              <Plus size={16} strokeWidth={1.9} />
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
