"use client";

import { useState } from "react";
import { InviteUserForm } from "./InviteUserForm";
import { MemberManagement } from "./MemberManagement";
import { PasswordChangeForm } from "./PasswordChangeForm";

export type SettingsSection = "password" | "invite" | "members";

type Member = {
  id: string;
  email: string;
  role: "admin" | "shared";
  createdAt: string;
};

type AdminSettingsBoxProps = {
  initialAdminEmail: string;
  initialSection?: SettingsSection;
  members: Member[];
};

const settingsSections: { id: SettingsSection; label: string }[] = [
  { id: "password", label: "Change Password" },
  { id: "invite", label: "Create Invitation" },
  { id: "members", label: "Manage Members" },
];

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

export function AdminSettingsBox({
  initialAdminEmail,
  initialSection = "password",
  members,
}: AdminSettingsBoxProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(initialSection);

  return (
    <div className="space-y-4">
      {settingsSections.map((section) => (
        <AccordionItem
          isOpen={activeSection === section.id}
          key={section.id}
          label={section.label}
          onToggle={() => setActiveSection((current) => (current === section.id ? null : section.id))}
        >
          {section.id === "password" ? <PasswordChangeForm /> : null}
          {section.id === "invite" ? <InviteUserForm /> : null}
          {section.id === "members" ? (
            <MemberManagement initialAdminEmail={initialAdminEmail} members={members} />
          ) : null}
        </AccordionItem>
      ))}
    </div>
  );
}
