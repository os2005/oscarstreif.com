import type { ProjectRecord } from "@/lib/project-types";
import { getProjectModuleBySlug } from "./registry";

export function resolveProjectModule(project: Pick<ProjectRecord, "slug"> | string) {
  const slug = typeof project === "string" ? project : project.slug;
  return getProjectModuleBySlug(slug);
}

export function projectHasRegisteredModule(project: Pick<ProjectRecord, "slug"> | string) {
  return resolveProjectModule(project) !== null;
}
