/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createProjectAction,
  deleteProjectAction,
  saveProjectAction,
  type ProjectEditorActionState,
} from "@/app/private/actions";
import type { ProjectRecord } from "@/lib/project-types";
import { FormMessage } from "./FormMessage";
import { ProjectGrid } from "./ProjectGrid";

const initialState: ProjectEditorActionState = {};

type ProjectManagementProps = {
  projects: ProjectRecord[];
};

export type ProjectsViewSection = "view-all-projects" | "project-table";
export type ManageProjectSection = "create-project" | "existing-projects";

function PreviewFrame({ previewImage, title }: { previewImage: string; title: string }) {
  if (!previewImage) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-white/[0.04] text-center">
        <span className="max-w-[12rem] font-mono text-[11px] uppercase tracking-[0.18em] text-paper/46">
          Preview pending
        </span>
      </div>
    );
  }

  return <img alt={`${title} preview`} className="h-40 w-full rounded-[1.5rem] object-cover" src={previewImage} />;
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-paper/58" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function ColorSwatch({ accentColor, secondaryColor }: { accentColor?: string; secondaryColor?: string }) {
  if (!accentColor && !secondaryColor) {
    return <span className="inline-flex h-4 w-10 rounded-full border border-paper/12 bg-white/[0.05]" />;
  }

  const background = secondaryColor
    ? `linear-gradient(135deg, ${accentColor ?? secondaryColor}, ${secondaryColor})`
    : accentColor;

  return <span className="inline-flex h-4 w-10 rounded-full border border-paper/12" style={{ background }} />;
}

function ProjectFields({
  prefix,
  project,
}: {
  prefix: string;
  project?: {
    title: string;
    slug: string;
    description: string;
    previewImage: string;
    accentColor?: string;
    secondaryColor?: string;
    externalUrl?: string;
    visibility: string;
    status: string;
    tags: string[];
  };
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${prefix}-title`}>Title</FieldLabel>
          <input
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.title ?? ""}
            id={`${prefix}-title`}
            name="title"
            required
            type="text"
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${prefix}-slug`}>Slug</FieldLabel>
          <input
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.slug ?? ""}
            id={`${prefix}-slug`}
            name="slug"
            placeholder="coldlog"
            required
            type="text"
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor={`${prefix}-description`}>Description</FieldLabel>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
          defaultValue={project?.description ?? ""}
          id={`${prefix}-description`}
          name="description"
          required
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${prefix}-previewImage`}>Screenshot URL</FieldLabel>
        <input
          className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
          defaultValue={project?.previewImage ?? ""}
          id={`${prefix}-previewImage`}
          name="previewImage"
          placeholder="https://..."
          required
          type="text"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <FieldLabel htmlFor={`${prefix}-visibility`}>Visibility</FieldLabel>
          <select
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.visibility ?? "open"}
            id={`${prefix}-visibility`}
            name="visibility"
          >
            <option value="private">Private</option>
            <option value="shared">Shared</option>
            <option value="open">Open</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${prefix}-status`}>Status</FieldLabel>
          <select
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.status ?? "draft"}
            id={`${prefix}-status`}
            name="status"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${prefix}-accentColor`}>Accent color</FieldLabel>
          <input
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.accentColor ?? ""}
            id={`${prefix}-accentColor`}
            name="accentColor"
            placeholder="#145cff"
            type="text"
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${prefix}-secondaryColor`}>Secondary color</FieldLabel>
          <input
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.secondaryColor ?? ""}
            id={`${prefix}-secondaryColor`}
            name="secondaryColor"
            placeholder="#6de0ff"
            type="text"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${prefix}-externalUrl`}>External redirect URL</FieldLabel>
          <input
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.externalUrl ?? ""}
            id={`${prefix}-externalUrl`}
            name="externalUrl"
            placeholder="https://coldlog.de"
            type="text"
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${prefix}-tags`}>Tags</FieldLabel>
          <input
            className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
            defaultValue={project?.tags.join(", ") ?? ""}
            id={`${prefix}-tags`}
            name="tags"
            placeholder="portfolio, chemistry"
            type="text"
          />
        </div>
      </div>
    </>
  );
}

function ProjectEditor({
  isFocused = false,
  project,
}: {
  isFocused?: boolean;
  project: ProjectRecord;
}) {
  const [state, formAction, pending] = useActionState(saveProjectAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <article
      className={`rounded-[2rem] border p-5 ${
        isFocused ? "border-accent/45 bg-accent/8 shadow-[0_0_0_1px_rgba(20,92,255,0.22)]" : "border-paper/12 bg-black/18"
      }`}
      id={`project-${project.id}`}
    >
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <PreviewFrame previewImage={project.previewImage} title={project.title} />
          <div className="mt-4 flex items-center gap-3">
            <ColorSwatch accentColor={project.accentColor} secondaryColor={project.secondaryColor} />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/44">{project.visibility}</p>
          </div>
          <p className="mt-3 break-all font-mono text-[11px] uppercase tracking-[0.18em] text-paper/44">{project.sharedPath}</p>
          <p className="mt-2 text-sm leading-6 text-paper/60">
            Last updated {new Date(project.updatedAt).toLocaleDateString("en-GB")}
          </p>
          {project.externalUrl ? (
            <p className="mt-2 break-all text-sm leading-6 text-paper/56">Redirects to {project.externalUrl}</p>
          ) : null}
        </div>
        <div className="space-y-4">
          {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
          {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}
          <form action={formAction} className="space-y-4">
            <input name="projectId" type="hidden" value={project.id} />
            <input name="previousSlug" type="hidden" value={project.slug} />
            <input name="previousVisibility" type="hidden" value={project.visibility} />
            <ProjectFields prefix={`project-${project.id}`} project={project} />
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-paper/16 bg-paper px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? "Saving..." : "Save project"}
              </button>
              <Link
                className="rounded-full border border-paper/16 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper transition hover:border-paper/40 hover:bg-white/6"
                href={project.sharedPath}
              >
                Visit shared page
              </Link>
            </div>
          </form>
          <form action={deleteProjectAction}>
            <input name="projectId" type="hidden" value={project.id} />
            <input name="projectPath" type="hidden" value={project.path} />
            <button
              className="rounded-full border border-red-400/30 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-red-100 transition hover:border-red-300/50 hover:bg-red-400/10"
              type="submit"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-[2rem] border border-paper/12 bg-white/[0.035] p-6">
      <p className="font-display text-3xl leading-none text-paper">{title}</p>
      <p className="mt-4 max-w-2xl leading-7 text-paper/66">{description}</p>
    </div>
  );
}

export function ViewAllProjectsSection({ projects }: ProjectManagementProps) {
  return (
    <section>
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48">Overview</p>
        <h3 className="mt-3 font-display text-4xl leading-none text-paper">All projects</h3>
      </div>
      <ProjectGrid
        emptyDescription="Projects will appear here once they exist in the central registry."
        emptyTitle="No projects yet"
        projects={projects}
        theme="dark"
      />
    </section>
  );
}

export function ProjectTableSection({ projects }: ProjectManagementProps) {
  return (
    <section>
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48">Registry</p>
        <h3 className="mt-3 font-display text-4xl leading-none text-paper">Project table view</h3>
      </div>

      {projects.length ? (
        <div className="overflow-x-auto rounded-[1.75rem] border border-paper/12 bg-black/18">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/48">Title</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/48">Visibility</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/48">Color</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/48">Status</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr className="border-b border-paper/8 last:border-b-0" key={project.id}>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="min-w-[220px]">
                      <p className="truncate text-sm text-paper">{project.title}</p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-paper/42">
                        {project.slug}
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/62">
                    {project.visibility}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <ColorSwatch accentColor={project.accentColor} secondaryColor={project.secondaryColor} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/62">
                    {project.status}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        className="rounded-full border border-paper/16 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper transition hover:border-paper/40 hover:bg-white/6"
                        href={`/private?section=existing-projects&project=${encodeURIComponent(project.id)}`}
                      >
                        Manage
                      </Link>
                      <Link
                        className="rounded-full border border-paper/16 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper transition hover:border-paper/40 hover:bg-white/6"
                        href={project.sharedPath}
                      >
                        Visit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          description="Projects will appear here once they exist in the registry."
          title="No projects to display"
        />
      )}
    </section>
  );
}

export function CreateProjectSection() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <section>
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48">Create project</p>
        <h3 className="mt-3 font-display text-4xl leading-none text-paper">New project</h3>
      </div>
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}
      <form action={formAction} className="space-y-4">
        <ProjectFields prefix="new-project" />
        <button
          className="rounded-full border border-paper/16 bg-paper px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Creating..." : "Create project"}
        </button>
      </form>
    </section>
  );
}

export function ExistingProjectsSection({
  focusedProjectId,
  projects,
}: ProjectManagementProps & {
  focusedProjectId?: string | null;
}) {
  const sortedProjects = [...projects].sort((left, right) => {
    if (focusedProjectId) {
      if (left.id === focusedProjectId) return -1;
      if (right.id === focusedProjectId) return 1;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });

  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48">Registry</p>
        <h3 className="mt-3 font-display text-4xl leading-none text-paper">Manage existing projects</h3>
      </div>
      {sortedProjects.length ? (
        sortedProjects.map((project) => (
          <ProjectEditor isFocused={project.id === focusedProjectId} key={project.id} project={project} />
        ))
      ) : (
        <EmptyState
          description="Create your first project here. Once it is active, it will automatically appear in the matching visibility area."
          title="No projects yet"
        />
      )}
    </section>
  );
}

export function ProjectManagement({ projects }: ProjectManagementProps) {
  return (
    <div className="space-y-8">
      <CreateProjectSection />
      <ExistingProjectsSection projects={projects} />
    </div>
  );
}
