import { Header } from "./Header";

export function SunPlaceholderPage({ dark = false }: { dark?: boolean }) {
  return (
    <main className={dark ? "min-h-dvh bg-ink text-paper" : "min-h-dvh bg-paper text-ink"}>
      <Header variant={dark ? "dark" : "light"} />
      <section className="flex min-h-[calc(100dvh-88px)] items-center justify-center px-6 py-12">
        <span className="font-display text-6xl leading-none md:text-8xl">Soon</span>
      </section>
    </main>
  );
}
