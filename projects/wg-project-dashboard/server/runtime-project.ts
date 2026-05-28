import { getCurrentUser } from "@/lib/auth";
import { getProjectAccessDecision } from "@/lib/project-access";
import { findProjectBySlug } from "@/lib/projects";
import { WG_PROJECT_DASHBOARD_SLUG } from "../types";

export async function getWgProjectDashboardAccessContext() {
  const project = findProjectBySlug(WG_PROJECT_DASHBOARD_SLUG);
  const user = await getCurrentUser();

  if (!project || project.status !== "active") {
    return {
      project: null,
      user,
      decision: null,
    };
  }

  return {
    project,
    user,
    decision: getProjectAccessDecision(project, user),
  };
}
