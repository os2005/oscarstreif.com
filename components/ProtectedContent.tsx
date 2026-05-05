import Link from "next/link";
import { Header } from "./Header";

type ProtectedContentProps = {
  title: string;
  description: string;
  label: string;
  children?: React.ReactNode;
};

export function ProtectedContent({ title, description, label, children }: ProtectedContentProps) {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <Header variant="dark" />
      <section className="mx-auto min-h-dvh w-full max-w-6xl px-6 py-24 md:px-8">
        <div className="max-w-4xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-paper/52">{label}</p>
          <h1 className="max-w-4xl font-display text-6xl leading-[0.94] md:text-8xl">{title}</h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-paper/70">{description}</p>
        </div>
        {children ? <div className="mt-14">{children}</div> : null}
        <div className="mt-14 flex gap-5 font-mono text-xs uppercase tracking-[0.2em] text-paper/68">
          <Link className="transition hover:text-white" href="/">
            Home
          </Link>
          <Link className="transition hover:text-white" href="/login">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
