import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ShaderGradientBackground } from "@/components/ShaderGradientBackground";

export default function Home() {
  return (
    <main className="relative h-dvh min-h-dvh overflow-hidden bg-black text-white">
      <ShaderGradientBackground />
      <Header variant="landing" />
      <Hero />
    </main>
  );
}
