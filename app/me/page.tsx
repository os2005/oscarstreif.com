import { ContactLinks } from "@/components/ContactLinks";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";

export const metadata = {
  title: "About",
};

export default function MePage() {
  return (
    <PageShell eyebrow="Oscar Streif" title="About Oscar">
      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <p className="max-w-3xl font-display text-3xl leading-tight md:text-5xl">
            I study chemistry at the Karlsruhe Institute of Technology and work on projects at the intersection of
            science, entrepreneurship and execution.
          </p>
          <Section title="Chemistry">
            <p>
              My academic base is chemistry at KIT in Karlsruhe. I am interested in technical depth, disciplined
              thinking and work that can move from theory into useful systems.
            </p>
          </Section>
          <Section title="Entrepreneurship">
            <p>
              Alongside my studies, I lead PionierGarage, a student entrepreneurship initiative at KIT, and stay active
              in the startup ecosystem around Karlsruhe.
            </p>
          </Section>
          <Section title="Execution">
            <p>
              I care about building, organizing and following through. My work is currently shaped by chemistry,
              entrepreneurship, KIT Gründerschmiede and personal projects.
            </p>
          </Section>
          <Section title="Scholarship">
            <p>
              I am supported by a scholarship. Details can be added here once the exact wording and public information
              should be finalized.
            </p>
          </Section>
          <ContactLinks />
        </div>
        <aside className="relative min-h-[520px] overflow-hidden border border-ink/15 bg-ink text-paper">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_28%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(160deg,rgba(255,255,255,0.18),transparent_42%)]" />
          <div className="absolute inset-x-8 bottom-8 border-t border-paper/30 pt-5 font-mono text-xs uppercase tracking-[0.24em] text-paper/70">
            Replaceable portrait placeholder
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
