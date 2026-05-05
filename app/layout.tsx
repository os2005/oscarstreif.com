import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter_Tight, Newsreader } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/GrainOverlay";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Oscar Streif",
    template: "%s | Oscar Streif",
  },
  description:
    "Oscar Streif studies chemistry at KIT and works across entrepreneurship, leadership, execution and personal projects.",
  metadataBase: new URL("https://oscarstreif.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} ${interTight.variable} ${plexMono.variable} font-sans antialiased`}>
        {children}
        <GrainOverlay />
      </body>
    </html>
  );
}
