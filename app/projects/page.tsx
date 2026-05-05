import { PageShell } from "@/components/PageShell";
import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/Section";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <PageShell eyebrow="Work in progress" title="Projects and focus areas">
      <Section title="Main focus areas">
        <div className="grid gap-4 md:grid-cols-2">
          <ProjectCard title="Chemistry" label="KIT" description="Academic work and scientific grounding at KIT." />
          <ProjectCard
            title="PionierGarage"
            label="Leadership"
            description="Chairman role in a student entrepreneurship initiative at KIT, including ecosystem formats such as GROW and Startup Karlsruhe."
          />
          <ProjectCard
            title="KIT Gründerschmiede"
            label="Chemistry and entrepreneurship"
            description="Chemistry-related activity in the entrepreneurial environment around KIT."
          />
          <ProjectCard
            title="Scholarship and academic development"
            label="Support"
            description="Scholarship-supported development. Exact details can be added once public wording is ready."
          />
        </div>
      </Section>
      <Section title="Personal projects">
        <div className="grid gap-4 md:grid-cols-2">
          <ProjectCard
            title="Personal systems"
            label="Building"
            description="A place for projects that turn ideas into tangible tools, workflows or experiments."
          />
          <ProjectCard
            title="Future project placeholder"
            label="Optional"
            description="Reserved for ColdLog, CodeLock or another project once there is enough public content."
          />
        </div>
      </Section>
    </PageShell>
  );
}
