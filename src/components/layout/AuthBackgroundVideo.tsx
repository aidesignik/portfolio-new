"use client";

export function AuthBackgroundVideo({ className }: { className?: string }) {
  return (
    <video
      className={className}
      src="/auth/background.mp4"
      autoPlay
      loop
      muted
      playsInline
      ref={(video) => {
        if (video) video.playbackRate = 0.75;
      }}
    />
  );
}
