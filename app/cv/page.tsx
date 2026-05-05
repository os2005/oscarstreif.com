import { CVSection } from "@/components/CVSection";
import { PageShell } from "@/components/PageShell";

export const metadata = {
  title: "CV",
};

export default function CVPage() {
  return (
    <PageShell eyebrow="Curriculum vitae" title="CV" quiet>
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col gap-4 border-b border-ink/20 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-4xl">Oscar Streif</h2>
            <p className="mt-2 text-sm text-ink/65">Chemistry student at KIT. Entrepreneurship, leadership and personal projects.</p>
          </div>
          <a
            className="no-print w-fit border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition hover:border-accent hover:text-accent"
            href="/Oscar_Streif_CV.pdf"
          >
            Download CV
          </a>
        </div>
        <CVSection title="Education" items={["Karlsruhe Institute of Technology, Chemistry. Dates and details to be added."]} />
        <CVSection title="Experience" items={["KIT Gründerschmiede, chemistry-related activity. Details to be added."]} />
        <CVSection title="Leadership" items={["Chairman, PionierGarage. Dates and details to be added."]} />
        <CVSection title="Projects" items={["Personal projects at the intersection of science, execution and systems."]} />
        <CVSection title="Scholarship / Awards" items={["Scholarship-supported development. Exact public wording to be added."]} />
        <CVSection title="Skills" items={["Chemistry", "Entrepreneurship", "Leadership", "Execution", "Project building"]} />
        <CVSection title="Contact" items={["os.streif@gmail.com", "LinkedIn URL placeholder"]} />
      </div>
    </PageShell>
  );
}
