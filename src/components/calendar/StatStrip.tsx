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
    <div className="flex divide-x divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {tiles.map((tile) => (
        <div key={tile.href} className="flex flex-1 items-center justify-between gap-2 px-4 py-3">
          <Link href={tile.href} className="min-w-0 flex-1 hover:opacity-70">
            <p className="truncate text-xs text-zinc-500">{tile.label}</p>
            <p className="text-xl font-semibold text-zinc-900">{tile.count}</p>
          </Link>
          {tile.addHref ? (
            <Link
              href={tile.addHref}
              aria-label={tile.addLabel}
              className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
            >
              +
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
