type CVSectionProps = {
  title: string;
  items: string[];
};

export function CVSection({ title, items }: CVSectionProps) {
  return (
    <section className="grid gap-4 border-b border-ink/15 py-6 md:grid-cols-[180px_1fr]">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink/55">{title}</h2>
      <ul className="space-y-3 text-base leading-7 text-ink/78">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
