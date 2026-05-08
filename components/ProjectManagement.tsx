/* eslint-disable @next/next/no-img-element */

"use client";

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

const initialState: ProjectEditorActionState = {};

type ProjectManagementProps = {
  projects: ProjectRecord[];
};

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
      <div className="grid gap-4 md:grid-cols-3">
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

function ProjectEditor({ project }: { project: ProjectRecord }) {
  const [state, formAction, pending] = useActionState(saveProjectAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <article className="rounded-[2rem] border border-paper/12 bg-black/18 p-5">
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <PreviewFrame previewImage={project.previewImage} title={project.title} />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/44">{project.path}</p>
          <p className="mt-2 text-sm leading-6 text-paper/60">
            Last updated {new Date(project.updatedAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <div className="space-y-4">
          {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
          {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}
          <form action={formAction} className="space-y-4">
            <input name="projectId" type="hidden" value={project.id} />
            <input name="previousSlug" type="hidden" value={project.slug} />
            <input name="previousVisibility" type="hidden" value={project.visibility} />
            <ProjectFields prefix={`project-${project.id}`} project={project} />
            <button
              className="rounded-full border border-paper/16 bg-paper px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Saving..." : "Save project"}
            </button>
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

export function ProjectManagement({ projects }: ProjectManagementProps) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-paper/12 bg-black/20 p-5 md:p-6">
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

      <section className="space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48">Registry</p>
          <h3 className="mt-3 font-display text-4xl leading-none text-paper">All projects</h3>
        </div>
        {projects.length ? (
          projects.map((project) => <ProjectEditor key={project.id} project={project} />)
        ) : (
          <div className="rounded-[2rem] border border-paper/12 bg-white/[0.035] p-6">
            <p className="font-display text-3xl leading-none text-paper">No projects yet</p>
            <p className="mt-4 max-w-2xl leading-7 text-paper/66">
              Create your first project here. Once it is active, it will automatically appear in the matching
              visibility area.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
