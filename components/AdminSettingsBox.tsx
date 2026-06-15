"use client";

import { useState } from "react";
import { ControlCenterAccordion } from "./ControlCenterAccordion";
import { InviteUserForm } from "./InviteUserForm";
import { MemberManagement } from "./MemberManagement";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { PublicPageSettingsForm } from "./PublicPageSettingsForm";
import type { PublicPageSettings } from "@/lib/public-page-settings";

export type SettingsSection = "password" | "invite" | "members" | "public-pages";

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
  publicPageSettings: PublicPageSettings;
};

const settingsSections: { id: SettingsSection; label: string }[] = [
  { id: "password", label: "Change Password" },
  { id: "invite", label: "Create Invitation" },
  { id: "members", label: "Manage Members" },
  { id: "public-pages", label: "Public Pages" },
];

export function AdminSettingsBox({
  initialAdminEmail,
  initialMemberError = null,
  initialSection = null,
  members,
  publicPageSettings,
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
          {section.id === "public-pages" ? <PublicPageSettingsForm settings={publicPageSettings} /> : null}
        </ControlCenterAccordion>
      ))}
    </div>
  );
}
