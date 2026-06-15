"use client";

import { useState } from "react";
import { AdminSettingsBox, type SettingsSection } from "./AdminSettingsBox";
import {
  CreateProjectSection,
  ExistingProjectsSection,
  ProjectTableSection,
  ViewAllProjectsSection,
  type ManageProjectSection,
  type ProjectsViewSection,
} from "./ProjectManagement";
import type { ProjectRecord } from "@/lib/project-types";
import type { PublicPageSettings } from "@/lib/public-page-settings";

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
  initialMemberError?: string | null;
  initialSection?: PrivateAreaSectionParam;
  members: Member[];
  projects: ProjectRecord[];
  publicPageSettings: PublicPageSettings;
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
    case "public-pages":
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
  initialMemberError = null,
  initialSection = "projects",
  members,
  projects,
  publicPageSettings,
  sharedAccounts,
}: PrivateAreaPanelProps) {
  const initialState = getInitialState(initialSection);
  const [activeTopLevel, setActiveTopLevel] = useState<ControlCenterTopLevelSection>(initialState.activeTopLevel);
  const activeSettingsSection = initialState.activeSettingsSection;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-8">
      <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <div className="px-3 py-3">
            <p className="text-sm font-medium text-neutral-500">Control Center</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">Workspace Tools</p>
          </div>
          <div className="mt-2 grid gap-1">
            {topLevelSections.map((section) => {
              const isActive = activeTopLevel === section.id;

              return (
                <button
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    isActive ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-neutral-100"
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
        </aside>

        <div className="min-w-0">
          {activeTopLevel === "projects" ? (
            <div className="grid gap-6">
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Overview</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">All Projects</h2>
                  </div>
                </div>
                <ViewAllProjectsSection projects={projects} />
              </section>
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5">
                  <p className="text-sm font-medium text-neutral-500">Registry</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Project Table</h2>
                </div>
                <ProjectTableSection projects={projects} sharedAccounts={sharedAccounts} />
              </section>
            </div>
          ) : null}

          {activeTopLevel === "manage-projects" ? (
            <div className="grid gap-6">
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5">
                  <p className="text-sm font-medium text-neutral-500">New record</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Create Project</h2>
                </div>
                <CreateProjectSection />
              </section>
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5">
                  <p className="text-sm font-medium text-neutral-500">Editors</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Manage Existing Projects</h2>
                </div>
                <ExistingProjectsSection
                  focusedProjectId={focusedProjectId}
                  key={focusedProjectId ?? "projects"}
                  projects={projects}
                />
              </section>
            </div>
          ) : null}

          {activeTopLevel === "settings" ? (
            <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <p className="text-sm font-medium text-neutral-500">Configuration</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Settings</h2>
              </div>
              <AdminSettingsBox
                initialAdminEmail={initialAdminEmail}
                initialMemberError={initialMemberError}
                initialSection={activeSettingsSection}
                members={members}
                publicPageSettings={publicPageSettings}
              />
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
