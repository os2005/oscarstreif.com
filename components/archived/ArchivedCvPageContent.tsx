import { PageShell } from "@/components/PageShell";

type CVEntry = {
  date: string;
  title: string;
  organization: string;
  bullets?: string[];
  note?: string;
};

type CVLine = {
  date: string;
  text: React.ReactNode;
};

const education: CVEntry[] = [
  {
    date: "since 10/24",
    title: "B.Sc. Chemistry",
    organization: "Karlsruhe Institute of Technology (KIT)",
    bullets: ["4th semester, within the standard period of study"],
  },
  {
    date: "2015 - 2023",
    title: "General University Entrance Qualification",
    organization: "Goethe-Gymnasium Emmendingen",
    bullets: [
      "Final grade: 1.4",
      "Advanced subjects: Mathematics, Physics and Chemistry",
      "Awarded the GDCh Prize as the top student of the year in Chemistry",
    ],
  },
];

const experience: CVEntry[] = [
  {
    date: "since 04/26",
    title: "Student Assistant",
    organization: "KIT-Gründerschmiede, Karlsruhe",
    bullets: [
      "Support in controlling at KIT-Gründerschmiede as well as in organizational optimization and further development of the unit",
      "Support in developing concepts for collaboration with student initiatives",
    ],
  },
  {
    date: "since 02/26",
    title: "Advisor",
    organization: "ColdLog GbR, Karlsruhe",
    bullets: [
      "Development of a product for digital cold-chain monitoring with a concrete intention to found a company",
      "Building a solution for automated temperature monitoring, documentation and alerts in case of deviations",
      "Conducting initial pilot phases with pilot customers",
    ],
  },
  {
    date: "01/24 - 03/24",
    title: "Intern",
    organization: "Architekturbüro Thiele, Freiburg",
    bullets: ["Assisted with architectural competitions, building construction projects and urban planning projects"],
  },
  {
    date: "09/23 - 11/23",
    title: "Intern",
    organization: "WEHRLE-WERK AG, Emmendingen",
    bullets: [
      "Internship in chemical engineering with a focus on chemical-technical processes in industrial wastewater treatment",
      "Assisted with commissioning, operation and metrological testing of wastewater treatment plants",
    ],
  },
  {
    date: "07/21",
    title: "Career Orientation Internship",
    organization: "SICK AG",
    bullets: ["Gained insights into computer science, electronics, circuit design and website integration"],
  },
];

const engagement: CVEntry[] = [
  {
    date: "since 10/25",
    title: "Chair",
    organization: "PionierGarage e.V., Karlsruhe",
    bullets: [
      "Strategic and organizational responsibility for PionierGarage e.V. as a student entrepreneurship initiative at KIT",
      "Leadership and coordination of an organization with more than 30 active members",
      "Further development of key projects such as GROW, Startup-Karlsruhe.de and external partnerships",
    ],
  },
  {
    date: "04/25 - 09/25",
    title: "Board Member / Head of External Relations",
    organization: "PionierGarage e.V., Karlsruhe",
    bullets: [
      "Responsible for sponsor acquisition, partner communication and external relations",
      "Built sponsoring partnerships and contributed to the financing of GROW 2025/26",
    ],
  },
  {
    date: "10/24 - 03/25",
    title: "Active Member",
    organization: "PionierGarage e.V., Karlsruhe",
    bullets: [
      "Contributed to the organization and implementation of GROW 2024/25",
      "Responsible for technical setup and preparation for event formats",
    ],
  },
  {
    date: "05/19 - 05/20",
    title: "Volunteer Gymnastics Coach",
    organization: "TV Sexau",
    bullets: ["Voluntary supervision and support in children's and youth gymnastics"],
  },
];

const awards: CVLine[] = [
  {
    date: "since 06/25",
    text: (
      <>
        <strong>Scholarship Holder</strong> of Stiftung Wissen + Kompetenzen
      </>
    ),
  },
  {
    date: "11/24",
    text: (
      <>
        <strong>1st Place</strong> in the idea competition of KIT-Gründerschmiede
      </>
    ),
  },
  {
    date: "07/23",
    text: (
      <>
        <strong>GDCh Prize</strong> as the top student of the year in Chemistry
      </>
    ),
  },
];

function CVSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink/15 py-8 md:grid md:grid-cols-[210px_1fr] md:gap-8">
      <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-ink/50 md:mb-0">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function CVEntryBlock({ entry }: { entry: CVEntry }) {
  return (
    <article className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[120px_1fr]">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink/45">{entry.date}</p>
      <div>
        <h3 className="font-display text-2xl leading-tight text-ink">{entry.title}</h3>
        <p className="mt-1 text-sm text-ink/55">{entry.organization}</p>
        {entry.bullets ? (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/76">
            {entry.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        {entry.note ? <p className="mt-3 text-xs leading-5 text-ink/48">{entry.note}</p> : null}
      </div>
    </article>
  );
}

function CVLineBlock({ item }: { item: CVLine }) {
  return (
    <div className="grid gap-3 py-3 first:pt-0 last:pb-0 md:grid-cols-[120px_1fr]">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink/45">{item.date}</p>
      <p className="text-sm leading-6 text-ink/76">{item.text}</p>
    </div>
  );
}

export function ArchivedCvPageContent() {
  return (
    <PageShell eyebrow="Curriculum vitae" title="CV" quiet>
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-ink/20 pb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-5xl leading-none md:text-6xl">Oscar Streif</h2>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-ink/50">Curriculum Vitae</p>
            </div>
            <div className="space-y-1.5 text-sm leading-6 text-ink/65 md:text-right">
              <p>Karlsruhe, Germany</p>
              <p>
                <a className="transition hover:text-accent" href="mailto:os.streif@gmail.com">
                  os.streif@gmail.com
                </a>
              </p>
              <p>
                <a
                  className="transition hover:text-accent"
                  href="https://www.linkedin.com/in/oscar-streif-9681262b1/"
                  rel="noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          </div>
        </header>

        <CVSection title="Profile">
          <p className="max-w-3xl font-display text-3xl leading-tight text-ink md:text-4xl">
            Bachelor&apos;s student in Chemistry at the Karlsruhe Institute of Technology with a strong interest in
            entrepreneurship, innovation and practical implementation.
          </p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ink/70">
            Alongside my studies, I serve as Chair of PionierGarage e.V., work as a student assistant at
            KIT-Gründerschmiede and am developing ColdLog, a product for digital cold-chain monitoring with a concrete
            intention to found a company.
          </p>
        </CVSection>

        <CVSection title="Education">
          {education.map((entry) => (
            <CVEntryBlock entry={entry} key={`${entry.date}-${entry.title}`} />
          ))}
        </CVSection>

        <CVSection title="Professional Experience">
          {experience.map((entry) => (
            <CVEntryBlock entry={entry} key={`${entry.date}-${entry.title}`} />
          ))}
        </CVSection>

        <CVSection title="Engagement and Responsibility">
          {engagement.map((entry) => (
            <CVEntryBlock entry={entry} key={`${entry.date}-${entry.title}`} />
          ))}
        </CVSection>

        <CVSection title="Awards and Scholarships">
          {awards.map((item) => (
            <CVLineBlock item={item} key={item.date} />
          ))}
        </CVSection>

        <footer className="border-t border-ink/15 pt-8 text-sm text-ink/55">
          <p>Karlsruhe, 26 April 2026</p>
        </footer>
      </div>
    </PageShell>
  );
}
