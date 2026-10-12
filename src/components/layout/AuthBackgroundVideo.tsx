"use client";

export function AuthBackgroundVideo({ className }: { className?: string }) {
  return (
    <video
      className={className}
      src="/auth/background.mp4"
      loop
      muted
      playsInline
      ref={(video) => {
        if (!video) return;
        video.playbackRate = 0.75;
        // Respect the OS/browser "reduce motion" preference — leave the
        // video on its static first frame instead of autoplaying a large,
        // continuously looping background animation.
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          video.play().catch(() => {});
        }
      }}
    />
  );
}
