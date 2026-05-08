import { AccessDenied } from "@/components/AccessDenied";
import { Header } from "@/components/Header";
import { PrivateAreaPanel, type PrivateAreaSectionParam } from "@/components/PrivateAreaPanel";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/auth-config";
import { getAccessForRole, listMembers } from "@/lib/auth";
import { listProjects } from "@/lib/projects";

export const metadata = {
  title: "Private",
};

type PrivatePageProps = {
  searchParams: Promise<{
    memberError?: string;
    project?: string;
    section?: string;
  }>;
};

function getInitialSection(section?: string): PrivateAreaSectionParam | null {
  if (
    section === "projects" ||
    section === "manage-projects" ||
    section === "settings" ||
    section === "password" ||
    section === "invite" ||
    section === "members" ||
    section === "view-all-projects" ||
    section === "project-table" ||
    section === "create-project" ||
    section === "existing-projects"
  ) {
    return section;
  }

  return null;
}

export default async function PrivatePage({ searchParams }: PrivatePageProps) {
  const access = await getAccessForRole("admin");
  const params = await searchParams;
  const initialSection = getInitialSection(params.section) ?? "projects";
  const members = listMembers();

  if (!access) {
    redirect("/login?next=%2Fprivate");
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <Header variant="dark" />
      <PrivateAreaPanel
        focusedProjectId={params.project ?? null}
        initialAdminEmail={ADMIN_EMAIL}
        initialMemberError={params.memberError ?? null}
        initialSection={initialSection}
        key={`${initialSection}:${params.project ?? ""}`}
        members={members}
        projects={listProjects()}
        sharedAccounts={members.filter((member) => member.role === "shared")}
      />
    </main>
  );
}
