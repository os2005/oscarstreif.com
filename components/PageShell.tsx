import { Header } from "./Header";

type PageShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  quiet?: boolean;
};

export function PageShell({ children, eyebrow, title, quiet = false }: PageShellProps) {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <Header />
      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-16 md:px-8 md:pt-24">
        <div className={quiet ? "mb-12" : "mb-20"}>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-ink/48">{eyebrow}</p>
          <h1 className="max-w-5xl font-display text-6xl leading-[0.92] md:text-8xl">{title}</h1>
        </div>
        {children}
      </section>
    </main>
  );
}
