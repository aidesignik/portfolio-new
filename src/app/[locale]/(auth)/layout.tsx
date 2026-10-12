import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar
        containerClassName="flex h-[60px] w-full items-center justify-between px-5 md:px-10"
        hideLoginLink
        showDivider={false}
        showMarketingCta
      />
      {/* Bottom margin matches the side margins (mx-4/mx-6) so the beige
          container is inset on all three edges, not just flush to the
          viewport bottom — min-h is reduced by that same amount and must
          stay in sync with AuthSplitScreen's own min-h (see its comment). */}
      <div className="mx-4 mb-4 min-h-[calc(100vh-76px)] rounded-[24px] bg-[#F3F1EA] md:mx-6 md:mb-6 md:min-h-[calc(100vh-84px)]">
        {children}
      </div>
    </div>
  );
}
