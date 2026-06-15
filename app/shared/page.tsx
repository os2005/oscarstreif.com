import { AccessDenied } from "@/components/AccessDenied";
import { ProjectGrid } from "@/components/ProjectGrid";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { redirect } from "next/navigation";
import { getAccessForRole } from "@/lib/auth";
import { listSharedProjectsForUser } from "@/lib/projects";

export const metadata = {
  title: "Shared",
};

export default async function SharedPage() {
  const access = await getAccessForRole("shared");

  if (!access) {
    redirect("/login?next=%2Fshared");
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  const projects = listSharedProjectsForUser(access.user);
  const displayName = access.user.email;

  return (
    <WorkspaceShell active="shared" eyebrow="Shared Workspace" title="Protected Shared Area">
      <section className="mx-auto min-h-[calc(100dvh-160px)] w-full max-w-[1440px] px-5 py-8 md:px-8">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 border-b border-neutral-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Projects shared with this account</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">Shared Projects</h2>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left md:text-right">
              <p className="text-xs font-medium text-neutral-500">Logged in as</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">{displayName}</p>
            </div>
          </div>

          <div className="mt-8">
            <ProjectGrid
              emptyDescription="Projects that are explicitly shared with this account will appear here."
              emptyTitle="No shared projects yet"
              projects={projects}
              theme="dark"
            />
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
