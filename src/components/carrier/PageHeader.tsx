import type { ReactNode } from "react";

// Title row — sits inside the page's own max-width wrapper (PageContent),
// directly above the work surface. Search/notifications/avatar live in the
// page-agnostic TopBar instead, rendered once by the gated layout.
export function PageHeader({
  title,
  context,
  actions,
  bold = false,
  hero = false,
}: {
  title: string;
  context?: string;
  actions?: ReactNode;
  // Opt-in heavier title weight (800) for pages asking for it, without
  // changing the default (600) every other page sharing this component
  // already uses.
  bold?: boolean;
  // Opt-in larger "hero" title (32px/650/-0.03em) for the Availability
  // calendar page specifically — every other page keeps its current size.
  hero?: boolean;
}) {
  return (
    <div className="flex min-h-[36px] shrink-0 items-center justify-between gap-4">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1
          className={`truncate text-[var(--ink-primary)] ${
            hero
              ? "text-[32px] font-[650] leading-[1.1] tracking-[-0.03em]"
              : `text-[24px] tracking-[-0.02em] ${bold ? "font-extrabold" : "font-semibold"}`
          }`}
        >
          {title}
        </h1>
        {context ? <span className="shrink-0 text-[14px] text-[var(--ink-secondary)]">{context}</span> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
