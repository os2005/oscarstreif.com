"use client";

import { useEffect, useState } from "react";
import { GrainGradient } from "@paper-design/shaders-react";

export function ShaderGradientBackground() {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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
    const durationMs = 1700;
    const start = performance.now();

    const easeInOut = (value: number) => 0.5 - Math.cos(Math.PI * value) / 2;

    const tick = (now: number) => {
      const rawProgress = Math.min((now - start) / durationMs, 1);
      setProgress(easeInOut(rawProgress));

      if (rawProgress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reducedMotion]);

  const introProgress = reducedMotion ? 1 : progress;
  const shaderScale = 0.74 + introProgress * 0.6;
  const shaderIntensity = 0.08 + introProgress * 0.26;
  const shaderSoftness = 0.92 - introProgress * 0.1;
  const wrapperOpacity = 0.12 + introProgress * 0.88;
  const wrapperScale = 0.94 + introProgress * 0.06;
  const wrapperTranslateY = (1 - introProgress) * 22;
  const blackVeilOpacity = 0.9 - introProgress * 0.48;
  const grayscaleOpacity = 0.85 - introProgress * 0.43;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0">
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          opacity: wrapperOpacity,
          transform: `translate3d(0, ${wrapperTranslateY}px, 0) scale(${wrapperScale})`,
        }}
      >
        <GrainGradient
          style={{ height: "100%", width: "100%" }}
          colorBack="hsl(0, 0%, 0%)"
          softness={shaderSoftness}
          intensity={shaderIntensity}
          noise={0}
          shape="corners"
          offsetX={0}
          offsetY={0}
          scale={shaderScale}
          rotation={0}
          speed={0.42}
          colors={["hsl(204, 18%, 54%)", "hsl(198, 34%, 76%)", "hsl(205, 28%, 42%)"]}
        />
      </div>
      <div className="absolute inset-0 bg-black" style={{ opacity: blackVeilOpacity }} />
      <div className="absolute inset-0 backdrop-grayscale" style={{ opacity: grayscaleOpacity }} />
    </div>
  );
}
