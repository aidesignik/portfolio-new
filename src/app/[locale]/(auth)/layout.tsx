import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar
        containerClassName="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-12"
        hideLoginLink
      />
      {children}
    </>
  );
}
