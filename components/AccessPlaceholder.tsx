import Link from "next/link";
import { Header } from "./Header";

type AccessPlaceholderProps = {
  title: string;
  description: string;
  label: string;
};

export function AccessPlaceholder({ title, description, label }: AccessPlaceholderProps) {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <Header variant="dark" />
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-28">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-paper/55">{label}</p>
        <h1 className="max-w-3xl font-display text-6xl leading-[0.95] md:text-8xl">{title}</h1>
        <p className="mt-8 max-w-xl text-lg leading-8 text-paper/68">{description}</p>
        <div className="mt-10 flex gap-4 font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
          <Link className="transition hover:text-white" href="/">
            Home
          </Link>
          <Link className="transition hover:text-white" href="/me">
            Me
          </Link>
        </div>
      </section>
    </main>
  );
}
