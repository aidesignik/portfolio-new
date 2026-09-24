import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/layout/UserMenu";

export async function PageHeader({
  title,
  context,
  actions,
}: {
  title: string;
  context?: string;
  actions?: ReactNode;
}) {
  const [session, t] = await Promise.all([auth(), getTranslations("common")]);
  const carrier = session
    ? await prisma.carrier.findUnique({ where: { userId: session.user.id }, select: { companyName: true } })
    : null;
  const displayName = carrier?.companyName ?? session?.user.name ?? session?.user.email ?? "";

  return (
    <div className="shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-panel)]">
      <div className="flex h-14 items-center justify-end gap-3 border-b border-[var(--border-hairline)] px-5">
        <div className="relative hidden sm:block">
          <Search size={14} strokeWidth={2} color="#A9A9B2" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder={t("search")}
            className="h-10 w-48 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] pl-9 pr-3 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-disabled)] transition-[border-color,box-shadow] duration-[.12s] ease-out focus:outline-none focus:border-[#2563EB] focus:shadow-[var(--focus-ring)]"
          />
        </div>
        <UserMenu
          name={displayName}
          email={session?.user.email ?? null}
          image={session?.user.image}
          profileHref="/carrier/onboarding"
          size={34}
        />
      </div>
      <div className="flex min-h-[60px] items-center justify-between gap-4 px-5 py-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate text-[25px] font-extrabold tracking-[-0.02em] text-[var(--ink-primary)]">{title}</h1>
          {context ? <span className="shrink-0 font-mono text-[13.5px] text-[var(--ink-muted)]">{context}</span> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
