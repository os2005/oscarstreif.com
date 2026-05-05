"use client";

import { GrainGradient } from "@paper-design/shaders-react";

export function ShaderGradientBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(0, 0%, 0%)"
        softness={0.82}
        intensity={0.34}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1.34}
        rotation={0}
        speed={0.28}
        colors={["hsl(204, 18%, 54%)", "hsl(198, 34%, 76%)", "hsl(205, 28%, 42%)"]}
      />
      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 backdrop-grayscale" />
    </div>
  );
}
