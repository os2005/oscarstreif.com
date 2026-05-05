import { AccessDenied } from "@/components/AccessDenied";
import { AuthCard } from "@/components/AuthCard";
import { InviteUserForm } from "@/components/InviteUserForm";
import { PageShell } from "@/components/PageShell";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { getAccessForRole } from "@/lib/auth";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const access = await getAccessForRole("admin");

  if (!access) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return (
    <PageShell eyebrow="Admin only" title="Settings">
      <div className="grid gap-8 lg:grid-cols-2">
        <AuthCard
          title="Change password"
          description="Update the admin password used for future logins. The new password will apply immediately."
        >
          <PasswordChangeForm />
        </AuthCard>
        <AuthCard
          title="Create invitation"
          description="Create a login for another person and choose whether they can access the Shared Area only or both Shared and Private."
        >
          <InviteUserForm />
        </AuthCard>
      </div>
    </PageShell>
  );
}
