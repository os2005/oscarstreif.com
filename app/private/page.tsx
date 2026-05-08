import { AccessDenied } from "@/components/AccessDenied";
import { PrivateAreaPanel, type PrivateAreaSectionParam } from "@/components/PrivateAreaPanel";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProtectedContent } from "@/components/ProtectedContent";
import { ADMIN_EMAIL } from "@/lib/auth-config";
import { getAccessForRole, listMembers } from "@/lib/auth";
import { listProjects, listProjectsByVisibility } from "@/lib/projects";

export const metadata = {
  title: "Private",
};

type PrivatePageProps = {
  searchParams: Promise<{
    section?: string;
  }>;
};

function getInitialSection(section?: string): PrivateAreaSectionParam | null {
  if (
    section === "settings" ||
    section === "projects" ||
    section === "password" ||
    section === "invite" ||
    section === "members" ||
    section === "create-project" ||
    section === "all-projects"
  ) {
    return section;
  }

  return null;
}

export default async function PrivatePage({ searchParams }: PrivatePageProps) {
  const access = await getAccessForRole("admin");
  const params = await searchParams;
  const initialSection = getInitialSection(params.section) ?? "settings";

  if (!access) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return (
    <ProtectedContent title="Private Area" label="Admin">
      <PrivateAreaPanel
        initialAdminEmail={ADMIN_EMAIL}
        initialSection={initialSection}
        members={listMembers()}
        projects={listProjects()}
      />
      <div className="mt-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/48">Private projects</p>
          <h2 className="mt-3 font-display text-5xl leading-none text-paper md:text-6xl">Restricted work</h2>
        </div>
        <ProjectGrid
          emptyDescription="Private projects will appear here once they are active and marked as private in the project registry."
          emptyTitle="No private projects yet"
          projects={listProjectsByVisibility("private")}
          theme="dark"
        />
      </div>
    </ProtectedContent>
  );
}
