type ProjectCardProps = {
  title: string;
  label: string;
  description: string;
};

export function ProjectCard({ title, label, description }: ProjectCardProps) {
  return (
    <article className="border border-ink/14 bg-white/35 p-6 transition duration-300 hover:border-accent/60">
      <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">{label}</p>
      <h3 className="font-display text-4xl leading-none">{title}</h3>
      <p className="mt-5 leading-7 text-ink/68">{description}</p>
    </article>
  );
}
