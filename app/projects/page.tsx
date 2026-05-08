import { PageShell } from "@/components/PageShell";
import { ProjectGrid } from "@/components/ProjectGrid";
import { listProjectsByVisibility } from "@/lib/projects";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <PageShell eyebrow="Project registry" title="Open projects">
      <ProjectGrid
        emptyDescription="Public projects will appear here once they are active and marked as open in the central project registry."
        emptyTitle="No open projects yet"
        projects={listProjectsByVisibility("open")}
      />
    </PageShell>
  );
}
