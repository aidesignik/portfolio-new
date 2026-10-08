import type { ReactNode } from "react";
import { NewRideShowcase } from "./NewRideShowcase";

// Shared split-screen shell for the login/register pages: the form sits
// directly on the page background (no shared card/border), a looping
// "create a ride" showcase (same on both pages, since there's only one
// audience while the client marketplace is hidden) floats as its own
// square media panel to the right — a Calendly-style panel standing in
// for a screen recording, a looping abstract video behind the animated
// showcase card. Shares Navbar's 1280px/48px(24px) container so the two
// line up, and vertically centers the row in the remaining viewport
// height below the 72px header. Below ~900px the columns wrap: form
// first, square panel full-width underneath.
export async function AuthSplitScreen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1280px] items-center px-6 py-14 md:px-12">
      <div className="flex w-full flex-wrap items-center justify-between gap-16">
        <div className="min-w-0 flex-[1_1_360px] max-w-[460px]">{children}</div>

        <div className="min-w-0 flex-[1_1_420px] max-w-[620px]">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-[32px] bg-[#15317F]"
            style={{ boxShadow: "0 20px 60px rgba(16,30,80,.18)" }}
          >
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src="/auth/background.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            {/* A light scrim keeps the floating white card readable against
                whatever the video's brightest moment happens to be. */}
            <div className="absolute inset-0 bg-[#0E2466]/20" />
            <NewRideShowcase className="relative h-full w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
