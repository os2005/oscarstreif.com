"use server";

import { revalidatePath } from "next/cache";
import { createInvitation, changeCurrentUserPassword } from "@/lib/auth";
import type { Role } from "@/lib/auth-types";

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

  if (nextPassword.length < 8) {
    return { error: "The new password must be at least 8 characters long." };
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
