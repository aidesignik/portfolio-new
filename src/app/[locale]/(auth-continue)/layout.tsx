import type { ReactNode } from "react";
import { AuthPageChrome } from "@/components/layout/AuthPageChrome";

// Its own route group (not nested under (auth)) specifically so this one
// screen's header can differ from login/register's — a parent layout
// can't be told by a child route to suppress something it already
// rendered, so the only way to vary the Navbar's showCta here is a
// separate top-level layout. Same shell otherwise.
export default function AuthContinueLayout({ children }: { children: ReactNode }) {
  return <AuthPageChrome showCta={false}>{children}</AuthPageChrome>;
}
