"use client";

import { useState } from "react";
import type { ProjectRecord } from "@/lib/project-types";
import { InviteUserForm } from "./InviteUserForm";
import { MemberManagement } from "./MemberManagement";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { ProjectManagement } from "./ProjectManagement";

type AdminSection = "password" | "invite" | "members";
type PanelSection = "settings" | "projects";

type Member = {
  id: string;
  email: string;
  role: "admin" | "shared";
  createdAt: string;
};

type AdminSettingsBoxProps = {
  initialAdminEmail: string;
  initialPanel?: PanelSection;
  initialSection?: AdminSection | null;
  members: Member[];
  projects: ProjectRecord[];
};

const sections: { id: AdminSection; label: string }[] = [
  { id: "password", label: "Change Password" },
  { id: "invite", label: "Create Invitation" },
  { id: "members", label: "Manage Members" },
];

const panels: { id: PanelSection; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "projects", label: "Projects" },
];

export function AdminSettingsBox({
  initialAdminEmail,
  initialPanel = "settings",
  initialSection = null,
  members,
  projects,
}: AdminSettingsBoxProps) {
  const [activePanel, setActivePanel] = useState<PanelSection>(initialPanel);
  const [activeSection, setActiveSection] = useState<AdminSection | null>(initialSection);

  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-paper/12 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-paper/45">Admin</p>
          <h2 className="font-display text-5xl leading-none text-paper md:text-6xl">
            {activePanel === "settings" ? "Settings" : "Projects"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full border border-paper/12 bg-black/24 p-1.5">
          {panels.map((panel) => (
            <button
              className={`rounded-full px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                activePanel === panel.id
                  ? "bg-accent text-white shadow-[0_0_24px_rgba(20,92,255,0.24)]"
                  : "text-paper/62 hover:bg-white/6 hover:text-paper"
              }`}
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              type="button"
            >
              {panel.label}
            </button>
          ))}
        </div>
      </div>

      {activePanel === "settings" ? (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2 rounded-full border border-paper/12 bg-black/24 p-1.5">
            {sections.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <button
                  className={`rounded-full px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                    isActive
                      ? "bg-accent text-white shadow-[0_0_24px_rgba(20,92,255,0.24)]"
                      : "text-paper/62 hover:bg-white/6 hover:text-paper"
                  }`}
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  type="button"
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          {activeSection ? (
            <div className="mt-8 rounded-[1.5rem] border border-paper/10 bg-black/24 p-5 md:p-7">
              {activeSection === "password" ? <PasswordChangeForm /> : null}
              {activeSection === "invite" ? <InviteUserForm /> : null}
              {activeSection === "members" ? (
                <MemberManagement initialAdminEmail={initialAdminEmail} members={members} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8">
          <ProjectManagement projects={projects} />
        </div>
      )}
    </section>
  );
}
