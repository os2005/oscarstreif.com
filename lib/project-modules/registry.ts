import { growSponsoringProjectModule } from "@/projects/grow-sponsoring/module";
import { wgProjectDashboardModule } from "@/projects/wg-project-dashboard/module";
import type { ProjectModuleDefinition } from "./types";

const projectModules = [growSponsoringProjectModule, wgProjectDashboardModule] as const satisfies readonly ProjectModuleDefinition[];

const projectModuleRegistry = new Map<string, ProjectModuleDefinition>();

for (const projectModule of projectModules) {
  const normalizedSlug = projectModule.slug.trim().toLowerCase();

  if (projectModuleRegistry.has(normalizedSlug)) {
    throw new Error(`Duplicate project module slug registered: ${normalizedSlug}`);
  }

  projectModuleRegistry.set(normalizedSlug, projectModule);
}

export function listProjectModules() {
  return [...projectModuleRegistry.values()];
}

export function getProjectModuleBySlug(slug: string) {
  return projectModuleRegistry.get(slug.trim().toLowerCase()) ?? null;
}
