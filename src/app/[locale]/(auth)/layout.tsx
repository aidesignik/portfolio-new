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
      <div className="min-h-[calc(100vh-60px)] mx-4 rounded-[24px] bg-[#F3F1EA] md:mx-6">{children}</div>
    </div>
  );
}
