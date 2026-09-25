import { Search, Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/layout/UserMenu";

// Persistent, page-agnostic — search, notifications, avatar only. Never a
// page title or a primary action; those live in each page's own title row.
export async function TopBar() {
  const [session, t] = await Promise.all([auth(), getTranslations("common")]);
  const carrier = session
    ? await prisma.carrier.findUnique({ where: { userId: session.user.id }, select: { companyName: true } })
    : null;
  const displayName = carrier?.companyName ?? session?.user.name ?? session?.user.email ?? "";

  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-hairline)] bg-white px-6">
      <div className="relative w-full max-w-[420px]">
        <Search
          size={16}
          strokeWidth={1.9}
          color="#A1A1AA"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="search"
          placeholder={t("search")}
          className="h-9 w-full rounded-[9px] border-0 bg-[#F7F7F8] pl-9 pr-14 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] outline-none transition-shadow duration-[.12s] ease-out focus:shadow-[var(--focus-ring)]"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] bg-white px-[6px] py-[2px] text-[11px] font-medium text-[var(--ink-muted)] shadow-[var(--shadow-pill)]">
          ⌘K
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
          aria-label={t("notifications")}
        >
          <Bell size={16} strokeWidth={1.9} />
        </button>
        <UserMenu
          name={displayName}
          email={session?.user.email ?? null}
          image={session?.user.image}
          profileHref="/carrier/onboarding"
          size={34}
        />
      </div>
    </div>
  );
}
