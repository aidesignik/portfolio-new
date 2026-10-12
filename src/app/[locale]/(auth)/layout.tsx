import type { ReactNode } from "react";
import { AuthPageChrome } from "@/components/layout/AuthPageChrome";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthPageChrome>{children}</AuthPageChrome>;
}
