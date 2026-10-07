import type { ReactNode } from "react";
import { NewRideShowcase } from "./NewRideShowcase";

// Shared split-screen shell for the login/register pages: the form sits
// directly on the page background (no shared card/border), a looping
// "create a ride" showcase (same on both pages, since there's only one
// audience while the client marketplace is hidden) floats as its own
// rounded card to the right — a Calendly-style panel standing in for a
// screen recording, a looping abstract video behind the animated showcase
// card. The panel is decorative, so it's dropped below the lg breakpoint
// rather than stacked under the form.
export async function AuthSplitScreen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="flex flex-col justify-center py-10">{children}</div>

        <div className="relative hidden aspect-square overflow-hidden rounded-[24px] bg-[#15317F] shadow-[0_20px_60px_rgba(16,30,80,.18)] lg:block">
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
    </main>
  );
}
