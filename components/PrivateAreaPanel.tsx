"use client";

import { useState } from "react";
import { AdminSettingsBox, type SettingsSection } from "./AdminSettingsBox";
import {
  AllProjectsSection,
  CreateProjectSection,
  type ProjectSection,
} from "./ProjectManagement";
import type { ProjectRecord } from "@/lib/project-types";

type Member = {
  id: string;
  email: string;
  role: "admin" | "shared";
  createdAt: string;
};

export type PrivateAreaSectionParam =
  | "settings"
  | "projects"
  | SettingsSection
  | ProjectSection;

type PrivateTopLevelSection = "settings" | "projects";

type PrivateAreaPanelProps = {
  initialAdminEmail: string;
  initialSection?: PrivateAreaSectionParam;
  members: Member[];
  projects: ProjectRecord[];
};

const topLevelSections: { id: PrivateTopLevelSection; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "settings", label: "Settings" },
];

function getInitialState(section?: PrivateAreaSectionParam): {
  activeTopLevel: PrivateTopLevelSection;
  activeProjectSection: ProjectSection | null;
  activeSettingsSection: SettingsSection | null;
} {
  switch (section) {
    case "projects":
    case "create-project":
    case "all-projects":
      return {
        activeTopLevel: "projects",
        activeProjectSection: section === "all-projects" ? "all-projects" : "create-project",
        activeSettingsSection: "password",
      };
    case "invite":
    case "members":
    case "password":
      return {
        activeTopLevel: "settings",
        activeProjectSection: "create-project",
        activeSettingsSection: section,
      };
    case "settings":
    default:
      return {
        activeTopLevel: "settings",
        activeProjectSection: "create-project",
        activeSettingsSection: "password",
      };
  }
}

function AccordionItem({
  children,
  isOpen,
  label,
  onToggle,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-paper/12 bg-black/20">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.035] md:px-6"
        onClick={onToggle}
        type="button"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/72">{label}</span>
        <span className="font-mono text-lg leading-none text-paper/54">{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen ? <div className="border-t border-paper/10 px-5 py-5 md:px-6 md:py-6">{children}</div> : null}
    </div>
  );
}

export function PrivateAreaPanel({
  initialAdminEmail,
  initialSection = "settings",
  members,
  projects,
}: PrivateAreaPanelProps) {
  const initialState = getInitialState(initialSection);
  const [activeTopLevel, setActiveTopLevel] = useState<PrivateTopLevelSection>(initialState.activeTopLevel);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection | null>(
    initialState.activeSettingsSection
  );
  const [activeProjectSection, setActiveProjectSection] = useState<ProjectSection | null>(
    initialState.activeProjectSection
  );

  function handleTopLevelChange(section: PrivateTopLevelSection) {
    setActiveTopLevel(section);

    if (section === "settings" && !activeSettingsSection) {
      setActiveSettingsSection("password");
    }

    if (section === "projects" && !activeProjectSection) {
      setActiveProjectSection("create-project");
    }
  }

  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-paper/12 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-paper/45">Admin</p>
          <h2 className="font-display text-5xl leading-none text-paper md:text-6xl">Control Center</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-paper/62 md:text-base">
            Switch between project administration and account settings, then expand the area you want to work in.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap gap-2 rounded-full border border-paper/12 bg-black/24 p-1.5">
          {topLevelSections.map((section) => {
            const isActive = activeTopLevel === section.id;

            return (
              <button
                className={`rounded-full px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                  isActive
                    ? "bg-accent text-white shadow-[0_0_24px_rgba(20,92,255,0.24)]"
                    : "text-paper/62 hover:bg-white/6 hover:text-paper"
                }`}
                key={section.id}
                onClick={() => handleTopLevelChange(section.id)}
                type="button"
              >
                {section.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-paper/10 bg-black/24 p-5 md:p-7">
          {activeTopLevel === "settings" ? (
            <AdminSettingsBox
              initialAdminEmail={initialAdminEmail}
              initialSection={activeSettingsSection ?? "password"}
              members={members}
            />
          ) : null}

          {activeTopLevel === "projects" ? (
            <div className="space-y-4">
              <AccordionItem
                isOpen={activeProjectSection === "create-project"}
                label="Create New Project"
                onToggle={() =>
                  setActiveProjectSection((current) =>
                    current === "create-project" ? null : "create-project"
                  )
                }
              >
                <CreateProjectSection />
              </AccordionItem>
              <AccordionItem
                isOpen={activeProjectSection === "all-projects"}
                label="All Projects"
                onToggle={() =>
                  setActiveProjectSection((current) => (current === "all-projects" ? null : "all-projects"))
                }
              >
                <AllProjectsSection projects={projects} />
              </AccordionItem>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
