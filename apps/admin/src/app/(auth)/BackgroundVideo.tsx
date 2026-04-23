"use client";

import { useEffect, useRef } from "react";

export default function BackgroundVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.play().catch(() => {
      // Autoplay can be blocked. The panel still has a dark fallback background.
    });
  }, []);

  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      className="absolute inset-0 size-full object-cover"
    >
      <source src="/auth-bg.mp4" type="video/mp4" />
    </video>
  );
}
