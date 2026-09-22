import type { ReactNode } from "react";

export function PageHeader({
  title,
  context,
  actions,
}: {
  title: string;
  context?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-4 border-b border-[var(--border-hairline)] bg-[var(--bg-panel)] px-5 py-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-[25px] font-extrabold tracking-[-0.02em] text-[var(--ink-primary)]">{title}</h1>
        {context ? <span className="shrink-0 font-mono text-[12.5px] text-[var(--ink-muted)]">{context}</span> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
