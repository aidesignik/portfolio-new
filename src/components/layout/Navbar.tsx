import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { MARKETPLACE_ENABLED } from "@/config/features";

export async function Navbar({
  containerClassName = "mx-auto flex max-w-5xl items-center justify-between px-4 py-3",
  hideLoginLink = false,
  showDivider = true,
  showMarketingCta = false,
}: {
  containerClassName?: string;
  hideLoginLink?: boolean;
  showDivider?: boolean;
  showMarketingCta?: boolean;
} = {}) {
  const [session, t, tNav] = await Promise.all([
    auth(),
    getTranslations("common"),
    getTranslations("nav"),
  ]);

  const dashboardHref =
    session?.user.role === "ADMIN"
      ? "/admin/carriers"
      : session?.user.role === "CARRIER"
        ? "/carrier/dashboard"
        : "/dashboard";

  // The avatar dropdown shows who's signed in — the carrier's company name
  // where there is one, falling back to the account name/email otherwise.
  const carrier =
    session?.user.role === "CARRIER"
      ? await prisma.carrier.findUnique({
          where: { userId: session.user.id },
          select: { companyName: true },
        })
      : null;
  const displayName = carrier?.companyName ?? session?.user.name ?? session?.user.email ?? "";
  const profileHref = session?.user.role === "CARRIER" ? "/carrier/onboarding" : null;

  return (
    <header className={`bg-white ${showDivider ? "border-b border-zinc-200" : ""}`}>
      <div className={containerClassName}>
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/travia-logo.svg" alt={t("appName")} className="h-7 w-auto" />
        </Link>
        <nav className="flex items-center gap-4">
          {showMarketingCta && !session?.user ? (
            <>
              <LocaleSwitcher variant="menu" />
              <a
                href="mailto:sales@travia.example"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                {tNav("talkToSales")}
              </a>
              <Link
                href="/register/carrier"
                className="rounded-[10px] bg-[#131314] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A2A2C]"
              >
                {tNav("getStartedFree")}
              </Link>
            </>
          ) : (
            <>
              {session?.user ? (
                <>
                  {/* With the marketplace hidden, "/" already redirects a signed-in
                      user straight to this same page (see src/proxy.ts) — the
                      logo link covers it, so this would just be a duplicate. */}
                  {MARKETPLACE_ENABLED ? (
                    <Link href={dashboardHref} className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                      {tNav("dashboard")}
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  {!hideLoginLink ? (
                    <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                      {tNav("login")}
                    </Link>
                  ) : null}
                  {MARKETPLACE_ENABLED ? (
                    <Link href="/register" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                      {tNav("register")}
                    </Link>
                  ) : null}
                </>
              )}
              {/* With the marketplace hidden this would just duplicate the login
                  page's own register link, so it only shows once there's a
                  distinct client side to contrast it against. */}
              {MARKETPLACE_ENABLED && session?.user.role !== "CARRIER" ? (
                <Link
                  href="/register/carrier"
                  className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
                >
                  {tNav("forCarriers")}
                </Link>
              ) : null}
              {session?.user ? (
                <UserMenu
                  name={displayName}
                  email={session.user.email ?? null}
                  image={session.user.image}
                  profileHref={profileHref}
                />
              ) : (
                <LocaleSwitcher />
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
