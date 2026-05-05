import { AccessDenied } from "@/components/AccessDenied";
import { AdminSettingsBox } from "@/components/AdminSettingsBox";
import { ProtectedContent } from "@/components/ProtectedContent";
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

type AdminSection = "password" | "invite" | "members";

function getInitialSection(section?: string): AdminSection | null {
  if (section === "password" || section === "invite" || section === "members") {
    return section;
  }

  return null;
}

export default async function PrivatePage({ searchParams }: PrivatePageProps) {
  const access = await getAccessForRole("admin");
  const params = await searchParams;

  if (!access) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return (
    <ProtectedContent title="Private Area" label="Admin">
      <AdminSettingsBox
        initialAdminEmail={ADMIN_EMAIL}
        initialSection={getInitialSection(params.section)}
        members={listMembers()}
      />
    </ProtectedContent>
  );
}
