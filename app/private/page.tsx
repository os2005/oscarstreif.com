import { AccessDenied } from "@/components/AccessDenied";
import { AdminSettingsBox } from "@/components/AdminSettingsBox";
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
    settings?: string;
  }>;
};

type AdminSection = "password" | "invite" | "members";
type PanelSection = "settings" | "projects";

function getInitialSection(section?: string): AdminSection | null {
  if (section === "password" || section === "invite" || section === "members") {
    return section;
  }

  return null;
}

function getInitialPanel(section?: string): PanelSection {
  if (section === "projects") {
    return "projects";
  }

  return "settings";
}

export default async function PrivatePage({ searchParams }: PrivatePageProps) {
  const access = await getAccessForRole("admin");
  const params = await searchParams;
  const settingsSection =
    getInitialSection(params.settings) ?? getInitialSection(params.section) ?? "password";

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
        initialPanel={getInitialPanel(params.section)}
        initialSection={settingsSection}
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
