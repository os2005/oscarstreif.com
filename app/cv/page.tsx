import { ContactLinks } from "@/components/ContactLinks";
import { CVSection } from "@/components/CVSection";
import { PageShell } from "@/components/PageShell";

export const metadata = {
  title: "CV",
  description: "Public CV for Oscar Streif.",
};

export default function CVPage() {
  return (
    <PageShell eyebrow="Curriculum vitae" quiet title="Oscar Streif">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
            Chemistry student at KIT working across science, entrepreneurship, leadership and practical execution.
          </p>

          <div className="mt-14">
            <CVSection
              items={[
                "Chemistry student at Karlsruhe Institute of Technology.",
                "Academic focus on technical depth, disciplined thinking and useful systems.",
              ]}
              title="Education"
            />
            <CVSection
              items={[
                "Lead PionierGarage, a student entrepreneurship initiative at KIT.",
                "Active in the startup ecosystem around Karlsruhe and KIT Gruenderschmiede.",
              ]}
              title="Leadership"
            />
            <CVSection
              items={[
                "Builds and organizes personal projects across web tools, knowledge systems and community workflows.",
                "Works on the intersection of science, entrepreneurship and execution.",
              ]}
              title="Projects"
            />
            <CVSection
              items={[
                "Chemistry and scientific thinking.",
                "Entrepreneurship, student initiatives and early-stage project execution.",
                "Structured communication, operations and follow-through.",
              ]}
              title="Focus"
            />
          </div>
        </div>

        <aside className="border-t border-ink/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="sticky top-8 space-y-8">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-ink/48">Profile</p>
              <p className="text-lg leading-8 text-ink/72">
                Based in Karlsruhe. Interested in chemistry, entrepreneurship, community building and turning ideas
                into working systems.
              </p>
            </div>
            <ContactLinks />
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
