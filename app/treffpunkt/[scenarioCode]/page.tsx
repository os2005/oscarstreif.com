import type { Metadata, Viewport } from "next";
import TreffpunktClient from "../TreffpunktClient";

type TreffpunktScenarioPageProps = {
  params: Promise<{
    scenarioCode: string;
  }>;
};

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

export default async function TreffpunktScenarioPage({ params }: TreffpunktScenarioPageProps) {
  const { scenarioCode } = await params;
  return <TreffpunktClient initialScenarioCode={scenarioCode} />;
}
