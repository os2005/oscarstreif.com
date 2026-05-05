type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export function Section({ title, children }: SectionProps) {
  return (
    <section className="border-t border-ink/15 pt-6">
      <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-ink/48">{title}</h2>
      <div className="max-w-3xl text-lg leading-8 text-ink/72">{children}</div>
    </section>
  );
}
