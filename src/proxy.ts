import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth/auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_SEGMENTS = ["dashboard", "requests", "bookings", "carrier", "admin"];

function isProtectedPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const withoutLocale = routing.locales.includes(segments[0] as never)
    ? segments.slice(1)
    : segments;
  return PROTECTED_SEGMENTS.includes(withoutLocale[0]);
}

export default async function middleware(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const session = await auth();
    if (!session?.user) {
      const locale =
        request.nextUrl.pathname.split("/").filter(Boolean)[0] &&
        routing.locales.includes(
          request.nextUrl.pathname.split("/").filter(Boolean)[0] as never,
        )
          ? request.nextUrl.pathname.split("/").filter(Boolean)[0]
          : routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
