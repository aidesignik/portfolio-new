import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FCFBF8]">
      <Navbar
        containerClassName="mx-auto flex h-[60px] max-w-[1024px] items-center justify-between px-5 md:px-10"
        hideLoginLink
      />
      {children}
    </div>
  );
}
