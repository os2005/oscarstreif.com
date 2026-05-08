import { AccessDenied } from "@/components/AccessDenied";
import { Header } from "@/components/Header";
import { ProjectGrid } from "@/components/ProjectGrid";
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
    <main className="min-h-dvh bg-ink text-paper">
      <Header variant="dark" />
      <section className="mx-auto min-h-[calc(100dvh-88px)] w-full max-w-7xl px-6 pb-12 pt-8 md:px-8">
        <div className="rounded-[2rem] border border-paper/12 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 border-b border-paper/10 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46">Protected</p>
              <h1 className="mt-3 font-display text-4xl leading-none text-paper md:text-5xl">Protected Shared Area</h1>
            </div>
            <div className="rounded-[1.25rem] border border-paper/12 bg-black/18 px-4 py-3 text-left md:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46">Logged in as</p>
              <p className="mt-2 text-sm text-paper/76">{displayName}</p>
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
    </main>
  );
}
