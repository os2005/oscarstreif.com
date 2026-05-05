"use client";

import { memo, useEffect, useState } from "react";
import { GrainGradient } from "@paper-design/shaders-react";

type ShaderMode = {
  paused: boolean;
  reduced: boolean;
};

const WEBGL_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
  powerPreference: "low-power",
};

function getShaderMode(): ShaderMode {
  if (typeof window === "undefined") {
    return { paused: false, reduced: false };
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowViewport = window.matchMedia("(max-width: 768px)").matches;
  const lowCoreDevice = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
  const veryHighDpr = window.devicePixelRatio >= 2.5;

  return {
    paused: document.visibilityState === "hidden",
    reduced: prefersReducedMotion || narrowViewport || lowCoreDevice || veryHighDpr,
  };
}

export const ShaderGradientBackground = memo(function ShaderGradientBackground() {
  const [mode, setMode] = useState<ShaderMode>(getShaderMode);

  useEffect(() => {
    const updateMode = () => {
      const nextMode = getShaderMode();
      setMode((currentMode) =>
        currentMode.paused === nextMode.paused && currentMode.reduced === nextMode.reduced ? currentMode : nextMode,
      );
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewportQuery = window.matchMedia("(max-width: 768px)");

    document.addEventListener("visibilitychange", updateMode);
    window.addEventListener("resize", updateMode, { passive: true });
    motionQuery.addEventListener("change", updateMode);
    viewportQuery.addEventListener("change", updateMode);
    updateMode();

    return () => {
      document.removeEventListener("visibilitychange", updateMode);
      window.removeEventListener("resize", updateMode);
      motionQuery.removeEventListener("change", updateMode);
      viewportQuery.removeEventListener("change", updateMode);
    };
  }, []);

  const shaderSpeed = mode.paused ? 0 : mode.reduced ? 0.2 : 0.42;
  const maxPixelCount = mode.reduced ? 520_000 : 1_050_000;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        minPixelRatio={0.55}
        maxPixelCount={maxPixelCount}
        webGlContextAttributes={WEBGL_CONTEXT_ATTRIBUTES}
        colorBack="hsl(0, 0%, 0%)"
        softness={0.82}
        intensity={0.34}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1.34}
        rotation={0}
        speed={shaderSpeed}
        colors={["hsl(204, 18%, 54%)", "hsl(198, 34%, 76%)", "hsl(205, 28%, 42%)"]}
      />
      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 backdrop-grayscale" />
    </div>
  );
});
