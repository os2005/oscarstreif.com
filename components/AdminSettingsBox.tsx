"use client";

import { useState } from "react";
import { ControlCenterAccordion } from "./ControlCenterAccordion";
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
  initialMemberError?: string | null;
  initialSection?: SettingsSection | null;
  members: Member[];
};

const settingsSections: { id: SettingsSection; label: string }[] = [
  { id: "password", label: "Change Password" },
  { id: "invite", label: "Create Invitation" },
  { id: "members", label: "Manage Members" },
];

export function AdminSettingsBox({
  initialAdminEmail,
  initialMemberError = null,
  initialSection = null,
  members,
}: AdminSettingsBoxProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(initialSection);

  return (
    <div className="space-y-4">
      {settingsSections.map((section) => (
        <ControlCenterAccordion
          isOpen={activeSection === section.id}
          key={section.id}
          label={section.label}
          onToggle={() => setActiveSection((current) => (current === section.id ? null : section.id))}
        >
          {section.id === "password" ? <PasswordChangeForm /> : null}
          {section.id === "invite" ? <InviteUserForm /> : null}
          {section.id === "members" ? (
            <MemberManagement
              initialAdminEmail={initialAdminEmail}
              initialError={initialMemberError}
              members={members}
            />
          ) : null}
        </ControlCenterAccordion>
      ))}
    </div>
  );
}
