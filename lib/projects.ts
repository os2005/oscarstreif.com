import { randomUUID } from "crypto";
import { updateProjectStore, readProjectStore } from "./project-store";
import type { ProjectRecord, ProjectStatus, ProjectVisibility, StoredProject } from "./project-types";

type UpsertProjectInput = {
  title: string;
  slug: string;
  description: string;
  visibility: ProjectVisibility;
  previewImage: string;
  accentColor?: string;
  secondaryColor?: string;
  externalUrl?: string;
  tags: string[];
  status: ProjectStatus;
};

export function normalizeProjectSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProjectPath(project: Pick<StoredProject, "visibility" | "slug">) {
  return `/project/${project.visibility}/${project.slug}`;
}

export function getProjectSharedPath(project: Pick<StoredProject, "slug">) {
  return `/shared/${project.slug}`;
}

function normalizeOptionalValue(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeColorValue(value?: string) {
  const normalized = normalizeOptionalValue(value);

  if (!normalized) {
    return undefined;
  }

  const colorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  return colorPattern.test(normalized) ? normalized : null;
}

function normalizeExternalUrl(value?: string) {
  const normalized = normalizeOptionalValue(value);

  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function toProjectRecord(project: StoredProject): ProjectRecord {
  return {
    ...project,
    path: getProjectPath(project),
    sharedPath: getProjectSharedPath(project),
    visitPath: getProjectSharedPath(project),
  };
}

export function listProjects() {
  return readProjectStore().projects
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(toProjectRecord);
}

export function listProjectsByVisibility(visibility: ProjectVisibility) {
  return listProjects().filter((project) => project.visibility === visibility && project.status === "active");
}

export function findProjectBySlug(slug: string) {
  const normalizedSlug = normalizeProjectSlug(slug);
  const project = readProjectStore().projects.find((entry) => entry.slug === normalizedSlug);
  return project ? toProjectRecord(project) : null;
}

export function findProjectByVisibilityAndSlug(visibility: ProjectVisibility, slug: string) {
  const project = findProjectBySlug(slug);
  if (!project) {
    return null;
  }

  if (project.visibility !== visibility) {
    return null;
  }

  return project;
}

function ensureUniqueSlug(projects: StoredProject[], slug: string, ignoredProjectId?: string) {
  return !projects.some((project) => project.slug === slug && project.id !== ignoredProjectId);
}

function validateProjectInput(input: UpsertProjectInput) {
  const slug = normalizeProjectSlug(input.slug);
  const accentColor = normalizeColorValue(input.accentColor);
  const secondaryColor = normalizeColorValue(input.secondaryColor);
  const externalUrl = normalizeExternalUrl(input.externalUrl);

  if (!input.title.trim()) {
    return { ok: false as const, error: "Please provide a project title." };
  }

  if (!slug) {
    return { ok: false as const, error: "Please provide a valid slug." };
  }

  if (!input.description.trim()) {
    return { ok: false as const, error: "Please add a short description." };
  }

  if (!input.previewImage.trim()) {
    return { ok: false as const, error: "Please provide a screenshot or preview image URL." };
  }

  if (accentColor === null) {
    return { ok: false as const, error: "Please provide a valid accent color in hex format." };
  }

  if (secondaryColor === null) {
    return { ok: false as const, error: "Please provide a valid secondary color in hex format." };
  }

  if (externalUrl === null) {
    return { ok: false as const, error: "Please provide a valid external URL starting with http or https." };
  }

  return {
    ok: true as const,
    payload: {
      ...input,
      title: input.title.trim(),
      slug,
      description: input.description.trim(),
      previewImage: input.previewImage.trim(),
      accentColor,
      secondaryColor,
      externalUrl,
      tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    },
  };
}

export function createProject(input: UpsertProjectInput) {
  const validation = validateProjectInput(input);
  if (!validation.ok) {
    return validation;
  }

  return updateProjectStore((store) => {
    if (!ensureUniqueSlug(store.projects, validation.payload.slug)) {
      return { ok: false as const, error: "A project with this slug already exists." };
    }

    const now = new Date().toISOString();
    const project: StoredProject = {
      id: randomUUID(),
      ...validation.payload,
      createdAt: now,
      updatedAt: now,
    };

    store.projects.push(project);

    return { ok: true as const, project: toProjectRecord(project) };
  });
}

export function updateProject(projectId: string, input: UpsertProjectInput) {
  const validation = validateProjectInput(input);
  if (!validation.ok) {
    return validation;
  }

  return updateProjectStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId);

    if (!project) {
      return { ok: false as const, error: "Project not found." };
    }

    if (!ensureUniqueSlug(store.projects, validation.payload.slug, projectId)) {
      return { ok: false as const, error: "A project with this slug already exists." };
    }

    project.title = validation.payload.title;
    project.slug = validation.payload.slug;
    project.description = validation.payload.description;
    project.visibility = validation.payload.visibility;
    project.previewImage = validation.payload.previewImage;
    project.tags = validation.payload.tags;
    project.status = validation.payload.status;
    project.updatedAt = new Date().toISOString();

    return { ok: true as const, project: toProjectRecord(project) };
  });
}

export function deleteProject(projectId: string) {
  return updateProjectStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId);

    if (!project) {
      return { ok: false as const, error: "Project not found." };
    }

    store.projects = store.projects.filter((entry) => entry.id !== projectId);

    return { ok: true as const, project: toProjectRecord(project) };
  });
}
