import { ProtectedContent } from "@/components/ProtectedContent";
import { ProjectGrid } from "@/components/ProjectGrid";
import { getAccessForRole } from "@/lib/auth";
import { listProjectsByVisibility } from "@/lib/projects";

export const metadata = {
  title: "Shared",
};

export default async function SharedPage() {
  const access = await getAccessForRole("shared");

  if (!access) {
    return null;
  }

  return (
    <ProtectedContent
      title="Shared Area"
      description="This area is only visible to invited users. Active shared projects are collected here centrally."
      label="Protected"
    >
      <ProjectGrid
        emptyDescription="Shared projects will appear here once they are marked as active and shared in the project registry."
        emptyTitle="No shared projects yet"
        projects={listProjectsByVisibility("shared")}
        theme="dark"
      />
    </ProtectedContent>
  );
}
