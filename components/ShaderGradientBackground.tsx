"use client";

import { memo, useEffect, useMemo, useState } from "react";

type Bubble = {
  id: string;
  left: string;
  top: string;
  size: string;
  opacity: number;
  blur: number;
  driftX: string;
  driftY: string;
  duration: string;
  delay: string;
};

const FULL_BUBBLES: Bubble[] = [
  {
    id: "bubble-a",
    left: "12%",
    top: "14%",
    size: "28rem",
    opacity: 0.28,
    blur: 12,
    driftX: "2.2rem",
    driftY: "-1.6rem",
    duration: "18s",
    delay: "-3s",
  },
  {
    id: "bubble-b",
    left: "84%",
    top: "18%",
    size: "30rem",
    opacity: 0.34,
    blur: 14,
    driftX: "-2.6rem",
    driftY: "1.4rem",
    duration: "22s",
    delay: "-9s",
  },
  {
    id: "bubble-c",
    left: "78%",
    top: "68%",
    size: "26rem",
    opacity: 0.24,
    blur: 12,
    driftX: "-1.8rem",
    driftY: "-2rem",
    duration: "20s",
    delay: "-6s",
  },
  {
    id: "bubble-d",
    left: "18%",
    top: "78%",
    size: "22rem",
    opacity: 0.2,
    blur: 10,
    driftX: "1.4rem",
    driftY: "-1.8rem",
    duration: "24s",
    delay: "-11s",
  },
];

const REDUCED_BUBBLES = FULL_BUBBLES.slice(0, 3);

function useReducedEffects() {
  const [reducedEffects, setReducedEffects] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      const narrowViewport = window.innerWidth < 900;
      const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
      const highPixelRatio = window.devicePixelRatio >= 2.25 && window.innerWidth < 1280;

      setReducedEffects(mediaQuery.matches || narrowViewport || weakCpu || highPixelRatio);
    };

    evaluate();
    mediaQuery.addEventListener("change", evaluate);
    window.addEventListener("resize", evaluate);

    return () => {
      mediaQuery.removeEventListener("change", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  return reducedEffects;
}

function ShaderGradientBackgroundInner() {
  const reducedEffects = useReducedEffects();

  const bubbles = useMemo(() => (reducedEffects ? REDUCED_BUBBLES : FULL_BUBBLES), [reducedEffects]);

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,248,255,0.12),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(244,248,255,0.14),transparent_30%),radial-gradient(circle_at_76%_74%,rgba(244,248,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
      {bubbles.map((bubble) => (
        <div
          className={`landing-bubble ${reducedEffects ? "landing-bubble-reduced" : ""}`}
          key={bubble.id}
          style={{
            left: bubble.left,
            top: bubble.top,
            width: bubble.size,
            height: bubble.size,
            opacity: bubble.opacity,
            filter: `blur(${bubble.blur}px)`,
            ["--bubble-drift-x" as string]: bubble.driftX,
            ["--bubble-drift-y" as string]: bubble.driftY,
            animationDuration: bubble.duration,
            animationDelay: bubble.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/38" />
    </div>
  );
}

export const ShaderGradientBackground = memo(ShaderGradientBackgroundInner);
