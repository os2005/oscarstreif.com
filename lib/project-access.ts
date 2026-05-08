import type { SessionUser } from "./auth-types";
import type { ProjectRecord } from "./project-types";

export type ProjectAccessDecision =
  | {
      kind: "allowed";
    }
  | {
      kind: "login-required";
      next: string;
    }
  | {
      kind: "denied";
    };

export function getProjectAccessDecision(
  project: Pick<ProjectRecord, "sharedPath" | "sharedWithUserIds" | "visibility">,
  user: SessionUser | null
): ProjectAccessDecision {
  if (project.visibility === "open") {
    return { kind: "allowed" };
  }

  if (!user) {
    return {
      kind: "login-required",
      next: project.sharedPath,
    };
  }

  if (user.role === "admin") {
    return { kind: "allowed" };
  }

  if (project.visibility === "shared" && project.sharedWithUserIds.includes(user.id)) {
    return { kind: "allowed" };
  }

  return { kind: "denied" };
}

export function canUserAccessProject(
  project: Pick<ProjectRecord, "sharedPath" | "sharedWithUserIds" | "visibility">,
  user: SessionUser | null
) {
  return getProjectAccessDecision(project, user).kind === "allowed";
}

export function filterProjectsByAccess<T extends Pick<ProjectRecord, "sharedPath" | "sharedWithUserIds" | "visibility">>(
  projects: T[],
  user: SessionUser | null
) {
  return projects.filter((project) => canUserAccessProject(project, user));
}
