import type { Metadata, Viewport } from "next";
import TreffpunktClient from "./TreffpunktClient";

export const metadata: Metadata = {
  title: "Hoodometer Karlsruhe | Oscar Streif",
  description:
    "Interaktive Karte zur Berechnung eines gewichteten Treffpunkts in Karlsruhe.",
  manifest: "/treffpunkt/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function TreffpunktPage() {
  return <TreffpunktClient />;
}
