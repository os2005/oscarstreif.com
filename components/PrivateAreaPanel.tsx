"use client";

import { useState } from "react";
import { AdminSettingsBox, type SettingsSection } from "./AdminSettingsBox";
import { ControlCenterAccordion } from "./ControlCenterAccordion";
import {
  CreateProjectSection,
  ExistingProjectsSection,
  ProjectTableSection,
  ViewAllProjectsSection,
  type ManageProjectSection,
  type ProjectsViewSection,
} from "./ProjectManagement";
import type { ProjectRecord } from "@/lib/project-types";

type Member = {
  id: string;
  email: string;
  role: "admin" | "shared";
  createdAt: string;
};

export type ControlCenterTopLevelSection = "projects" | "manage-projects" | "settings";

export type PrivateAreaSectionParam =
  | ControlCenterTopLevelSection
  | SettingsSection
  | ProjectsViewSection
  | ManageProjectSection;

type PrivateAreaPanelProps = {
  focusedProjectId?: string | null;
  initialAdminEmail: string;
  initialSection?: PrivateAreaSectionParam;
  members: Member[];
  projects: ProjectRecord[];
  sharedAccounts: Member[];
};

const topLevelSections: { id: ControlCenterTopLevelSection; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "manage-projects", label: "Manage Projects" },
  { id: "settings", label: "Settings" },
];

function getInitialState(section?: PrivateAreaSectionParam): {
  activeManageSection: ManageProjectSection | null;
  activeProjectsSection: ProjectsViewSection | null;
  activeSettingsSection: SettingsSection | null;
  activeTopLevel: ControlCenterTopLevelSection;
} {
  switch (section) {
    case "view-all-projects":
    case "project-table":
      return {
        activeTopLevel: "projects",
        activeProjectsSection: section,
        activeManageSection: null,
        activeSettingsSection: null,
      };
    case "create-project":
    case "existing-projects":
      return {
        activeTopLevel: "manage-projects",
        activeProjectsSection: null,
        activeManageSection: section,
        activeSettingsSection: null,
      };
    case "password":
    case "invite":
    case "members":
      return {
        activeTopLevel: "settings",
        activeProjectsSection: null,
        activeManageSection: null,
        activeSettingsSection: section,
      };
    case "manage-projects":
      return {
        activeTopLevel: "manage-projects",
        activeProjectsSection: null,
        activeManageSection: null,
        activeSettingsSection: null,
      };
    case "settings":
      return {
        activeTopLevel: "settings",
        activeProjectsSection: null,
        activeManageSection: null,
        activeSettingsSection: null,
      };
    case "projects":
    default:
      return {
        activeTopLevel: "projects",
        activeProjectsSection: null,
        activeManageSection: null,
        activeSettingsSection: null,
      };
  }
}

export function PrivateAreaPanel({
  focusedProjectId = null,
  initialAdminEmail,
  initialSection = "projects",
  members,
  projects,
  sharedAccounts,
}: PrivateAreaPanelProps) {
  const initialState = getInitialState(initialSection);
  const [activeTopLevel, setActiveTopLevel] = useState<ControlCenterTopLevelSection>(initialState.activeTopLevel);
  const [activeProjectsSection, setActiveProjectsSection] = useState<ProjectsViewSection | null>(
    initialState.activeProjectsSection
  );
  const [activeManageSection, setActiveManageSection] = useState<ManageProjectSection | null>(
    initialState.activeManageSection
  );
  const activeSettingsSection = initialState.activeSettingsSection;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] w-full max-w-7xl flex-col px-6 pb-12 pt-8 md:px-8">
      <div className="flex flex-wrap gap-2 rounded-full border border-paper/12 bg-black/24 p-1.5">
        <div className="mr-3 flex items-center px-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46">Private Workspace</span>
        </div>
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
              onClick={() => setActiveTopLevel(section.id)}
              type="button"
            >
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex-1">
        {activeTopLevel === "projects" ? (
          <div className="space-y-4">
            <ControlCenterAccordion
              isOpen={activeProjectsSection === "view-all-projects"}
              label="View All Projects"
              onToggle={() =>
                setActiveProjectsSection((current) => (current === "view-all-projects" ? null : "view-all-projects"))
              }
            >
              <ViewAllProjectsSection projects={projects} />
            </ControlCenterAccordion>
            <ControlCenterAccordion
              isOpen={activeProjectsSection === "project-table"}
              label="Project Table View"
              onToggle={() =>
                setActiveProjectsSection((current) => (current === "project-table" ? null : "project-table"))
              }
            >
              <ProjectTableSection projects={projects} sharedAccounts={sharedAccounts} />
            </ControlCenterAccordion>
          </div>
        ) : null}

        {activeTopLevel === "manage-projects" ? (
          <div className="space-y-4">
            <ControlCenterAccordion
              isOpen={activeManageSection === "create-project"}
              label="Create New Project"
              onToggle={() =>
                setActiveManageSection((current) => (current === "create-project" ? null : "create-project"))
              }
            >
              <CreateProjectSection />
            </ControlCenterAccordion>
            <ControlCenterAccordion
              isOpen={activeManageSection === "existing-projects"}
              label="All Projects / Manage Existing Projects"
              onToggle={() =>
                setActiveManageSection((current) => (current === "existing-projects" ? null : "existing-projects"))
              }
            >
              <ExistingProjectsSection
                focusedProjectId={focusedProjectId}
                key={focusedProjectId ?? "projects"}
                projects={projects}
              />
            </ControlCenterAccordion>
          </div>
        ) : null}

        {activeTopLevel === "settings" ? (
          <AdminSettingsBox
            initialAdminEmail={initialAdminEmail}
            initialSection={activeSettingsSection}
            members={members}
          />
        ) : null}
      </div>
    </div>
  );
}
