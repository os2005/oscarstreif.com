"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { changeCurrentUserPassword, createInvitation, deleteMember, getAccessForRole, updateMemberRole } from "@/lib/auth";
import type { Role } from "@/lib/auth-types";
import {
  createProject,
  deleteProject,
  getProjectPath,
  getProjectSharedPath,
  updateProject,
  updateProjectSharedAccess,
} from "@/lib/projects";
import type { ProjectStatus, ProjectVisibility } from "@/lib/project-types";

export type PasswordActionState = {
  error?: string;
  success?: string;
};

export type InviteActionState = {
  error?: string;
  success?: string;
  credentials?: {
    email: string;
    password: string;
    role: Role;
  };
};

export type ProjectEditorActionState = {
  error?: string;
  success?: string;
};

function revalidateProjectSurfaces(paths: string[]) {
  revalidatePath("/private");
  revalidatePath("/shared");
  revalidatePath("/projects");

  for (const path of paths) {
    revalidatePath(path);
  }
}

function parseProjectFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const description = String(formData.get("description") ?? "");
  const previewImage = String(formData.get("previewImage") ?? "");
  const accentColor = formData.has("accentColor") ? String(formData.get("accentColor") ?? "") : undefined;
  const secondaryColor = formData.has("secondaryColor")
    ? String(formData.get("secondaryColor") ?? "")
    : undefined;
  const externalRedirectUrl = String(formData.get("externalRedirectUrl") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const sharedWithUserIds = formData.has("sharedWithUserIds")
    ? formData
        .getAll("sharedWithUserIds")
        .map((value) => String(value).trim())
        .filter(Boolean)
    : undefined;
  const visibility = String(formData.get("visibility") ?? "open");
  const status = String(formData.get("status") ?? "draft");

  if (visibility !== "private" && visibility !== "shared" && visibility !== "open") {
    return { ok: false as const, error: "Please choose a valid visibility level." };
  }

  if (status !== "draft" && status !== "active" && status !== "archived") {
    return { ok: false as const, error: "Please choose a valid project status." };
  }

  return {
    ok: true as const,
    payload: {
      title,
      slug,
      description,
      previewImage,
      accentColor,
      secondaryColor,
      externalRedirectUrl,
      sharedWithUserIds,
      tags,
      visibility: visibility as ProjectVisibility,
      status: status as ProjectStatus,
    },
  };
}

export async function changePasswordAction(
  _: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return { error: "Please complete all password fields." };
  }

  if (!nextPassword.trim()) {
    return { error: "The new password cannot be empty." };
  }

  if (nextPassword !== confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  const result = await changeCurrentUserPassword(currentPassword, nextPassword);
  if (!result.ok) {
    return { error: result.error };
  }

  return { success: "Password updated successfully." };
}

export async function createInvitationAction(
  _: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "shared");

  if (!email) {
    return { error: "Please enter an email address." };
  }

  if (role !== "shared" && role !== "admin") {
    return { error: "Please choose a valid access role." };
  }

  const result = await createInvitation(email, role);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/private");

  return {
    success: "Invitation created successfully.",
    credentials: {
      email: result.email,
      password: result.password,
      role: result.role,
    },
  };
}

export async function createProjectAction(
  _: ProjectEditorActionState,
  formData: FormData
): Promise<ProjectEditorActionState> {
  const access = await getAccessForRole("admin");
  if (!access?.allowed) {
    return { error: "Only admins can manage projects." };
  }

  const parsed = parseProjectFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const result = createProject(parsed.payload);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidateProjectSurfaces([result.project.path, result.project.sharedPath]);

  return { success: "Project created successfully." };
}

export async function saveProjectAction(
  _: ProjectEditorActionState,
  formData: FormData
): Promise<ProjectEditorActionState> {
  const access = await getAccessForRole("admin");
  if (!access?.allowed) {
    return { error: "Only admins can manage projects." };
  }

  const projectId = String(formData.get("projectId") ?? "");
  const previousSlug = String(formData.get("previousSlug") ?? "");
  const previousVisibility = String(formData.get("previousVisibility") ?? "open");

  if (!projectId) {
    return { error: "Project not found." };
  }

  const parsed = parseProjectFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const result = updateProject(projectId, parsed.payload);
  if (!result.ok) {
    return { error: result.error };
  }

  const stalePath =
    previousVisibility === "private" || previousVisibility === "shared" || previousVisibility === "open"
      ? getProjectPath({ visibility: previousVisibility, slug: previousSlug })
      : null;
  const staleSharedPath = previousSlug ? getProjectSharedPath({ slug: previousSlug }) : null;
  const nextPaths = [result.project.path, result.project.sharedPath];

  if (stalePath) {
    nextPaths.push(stalePath);
  }

  if (staleSharedPath) {
    nextPaths.push(staleSharedPath);
  }

  revalidateProjectSurfaces(nextPaths);

  return { success: "Project saved successfully." };
}

export async function updateMemberRoleAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const role = String(formData.get("role") ?? "shared");

  await updateMemberRole(memberId, role === "admin" ? "admin" : "shared");
  revalidatePath("/private");
  redirect("/private?section=members");
}

export async function deleteMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");

  await deleteMember(memberId);
  revalidatePath("/private");
  redirect("/private?section=members");
}

export async function deleteProjectAction(formData: FormData) {
  const access = await getAccessForRole("admin");
  if (!access?.allowed) {
    redirect("/private");
  }

  const projectId = String(formData.get("projectId") ?? "");
  const projectPath = String(formData.get("projectPath") ?? "");

  const result = deleteProject(projectId);
  if (result.ok) {
    const paths = projectPath ? [projectPath] : [];
    paths.push(result.project.sharedPath);
    revalidateProjectSurfaces(paths);
  }

  redirect("/private?section=existing-projects");
}

export async function updateProjectSharedAccessAction(formData: FormData) {
  const access = await getAccessForRole("admin");
  if (!access?.allowed) {
    redirect("/private");
  }

  const projectId = String(formData.get("projectId") ?? "");
  const sharedWithUserIds = formData
    .getAll("sharedWithUserIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!projectId) {
    redirect("/private?section=project-table");
  }

  const result = updateProjectSharedAccess(projectId, sharedWithUserIds);
  if (result.ok) {
    revalidateProjectSurfaces([result.project.path, result.project.sharedPath]);
  }

  redirect("/private?section=project-table");
}
