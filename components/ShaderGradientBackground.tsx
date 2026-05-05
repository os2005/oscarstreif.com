"use client";

import { useEffect, useMemo, useState } from "react";

type BubbleConfig = {
  id: string;
  finalX: number;
  finalY: number;
  startX: number;
  startY: number;
  size: number;
  startScale: number;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  driftDuration: number;
};

const bubbles: BubbleConfig[] = [
  {
    id: "top-left",
    finalX: 18,
    finalY: 20,
    startX: 6,
    startY: 7,
    size: 28,
    startScale: 0.18,
    opacity: 0.6,
    blur: 18,
    duration: 1450,
    delay: 0,
    driftX: 1.2,
    driftY: -0.8,
    driftDuration: 16,
  },
  {
    id: "upper-right",
    finalX: 82,
    finalY: 18,
    startX: 95,
    startY: 6,
    size: 34,
    startScale: 0.16,
    opacity: 0.7,
    blur: 22,
    duration: 1650,
    delay: 80,
    driftX: -1.4,
    driftY: 1.1,
    driftDuration: 18,
  },
  {
    id: "mid-right",
    finalX: 78,
    finalY: 48,
    startX: 97,
    startY: 38,
    size: 44,
    startScale: 0.14,
    opacity: 0.76,
    blur: 24,
    duration: 1750,
    delay: 140,
    driftX: -1.8,
    driftY: -0.9,
    driftDuration: 20,
  },
  {
    id: "bottom-left",
    finalX: 16,
    finalY: 84,
    startX: 4,
    startY: 95,
    size: 32,
    startScale: 0.17,
    opacity: 0.56,
    blur: 18,
    duration: 1500,
    delay: 110,
    driftX: 1,
    driftY: -1.2,
    driftDuration: 19,
  },
  {
    id: "bottom-right",
    finalX: 84,
    finalY: 82,
    startX: 96,
    startY: 96,
    size: 30,
    startScale: 0.16,
    opacity: 0.52,
    blur: 16,
    duration: 1380,
    delay: 60,
    driftX: -0.9,
    driftY: -1,
    driftDuration: 17,
  },
];

function easeInOut(value: number) {
  return 0.5 - Math.cos(Math.PI * value) / 2;
}

function clampProgress(elapsed: number, delay: number, duration: number) {
  return Math.min(Math.max((elapsed - delay) / duration, 0), 1);
}

export function ShaderGradientBackground() {
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const totalDuration = useMemo(
    () => Math.max(...bubbles.map((bubble) => bubble.delay + bubble.duration), 0),
    []
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const nextElapsed = Math.min(now - start, totalDuration);
      setElapsed(nextElapsed);

      if (nextElapsed < totalDuration) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reducedMotion, totalDuration]);

  const introElapsed = reducedMotion ? totalDuration : elapsed;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.04),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.01),rgba(0,0,0,0))]" />
      {bubbles.map((bubble) => {
        const introProgress = easeInOut(clampProgress(introElapsed, bubble.delay, bubble.duration));
        const currentX = bubble.startX + (bubble.finalX - bubble.startX) * introProgress;
        const currentY = bubble.startY + (bubble.finalY - bubble.startY) * introProgress;
        const currentScale = bubble.startScale + (1 - bubble.startScale) * introProgress;
        const currentOpacity = bubble.opacity * (0.18 + introProgress * 0.82);

        return (
          <div
            className="absolute rounded-full will-change-transform bubble-drift"
            key={bubble.id}
            style={{
              left: `${currentX}%`,
              top: `${currentY}%`,
              width: `${bubble.size}vw`,
              height: `${bubble.size}vw`,
              minWidth: `${bubble.size * 4.2}px`,
              minHeight: `${bubble.size * 4.2}px`,
              opacity: currentOpacity,
              filter: `blur(${bubble.blur}px)`,
              transform: `translate(-50%, -50%) scale(${currentScale})`,
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.76) 24%, rgba(245,247,250,0.44) 52%, rgba(255,255,255,0.08) 72%, rgba(255,255,255,0) 100%)",
              animationDuration: `${bubble.driftDuration}s`,
              animationDelay: `${-bubble.delay / 1000}s`,
              ["--bubble-drift-x" as string]: `${bubble.driftX}vw`,
              ["--bubble-drift-y" as string]: `${bubble.driftY}vh`,
            }}
          />
        );
      })}
      <div className="absolute inset-0 bg-black/42" />
    </div>
  );
}
