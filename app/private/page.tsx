import { AccessDenied } from "@/components/AccessDenied";
import { AuthCard } from "@/components/AuthCard";
import { InviteUserForm } from "@/components/InviteUserForm";
import { MemberManagement } from "@/components/MemberManagement";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { ProtectedContent } from "@/components/ProtectedContent";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { ADMIN_EMAIL } from "@/lib/auth-config";
import { getAccessForRole, listMembers } from "@/lib/auth";

export const metadata = {
  title: "Private",
};

type PrivatePageProps = {
  searchParams: Promise<{
    section?: string;
  }>;
};

function renderSection(section: "overview" | "password" | "invite" | "members") {
  if (section === "password") {
    return (
      <AuthCard title="Change Password" description="Update your admin password for future logins." tone="dark">
        <PasswordChangeForm />
      </AuthCard>
    );
  }

  if (section === "invite") {
    return (
      <AuthCard title="Create Invitation" description="Create a login for a new shared user." tone="dark">
        <InviteUserForm />
      </AuthCard>
    );
  }

  return null;
}

export default async function PrivatePage({ searchParams }: PrivatePageProps) {
  const access = await getAccessForRole("admin");
  const members = listMembers();
  const params = await searchParams;
  const section =
    params.section === "password" || params.section === "invite" || params.section === "members" ? params.section : "overview";

  if (!access) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return (
    <ProtectedContent
      title="Private Area"
      description="This area is only visible to the admin."
      label="Admin only"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/48">Admin workspace</p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-paper/68">
            Use the internal settings menu to manage credentials, invitations and member access.
          </p>
        </div>
        <SettingsDropdown activeSection={section} />
      </div>

      <div className="mt-10">
        {section === "members" ? (
          <AuthCard title="Manage Members" description="Review all existing logins, adjust access levels or delete members." tone="dark">
            <MemberManagement initialAdminEmail={ADMIN_EMAIL} members={members} />
          </AuthCard>
        ) : section === "overview" ? (
          <AuthCard title="Admin Overview" description="Open the settings menu to change your password, invite shared users or manage members." tone="dark">
            <p className="max-w-2xl text-base leading-7 text-paper/72">
              Shared users can only access the Shared Area. The Private Area and all member administration remain restricted
              to the admin account.
            </p>
          </AuthCard>
        ) : (
          renderSection(section)
        )}
      </div>
    </ProtectedContent>
  );
}
