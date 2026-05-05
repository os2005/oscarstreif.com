"use server";

import { redirect } from "next/navigation";
import { loginWithCredentials, logoutCurrentUser } from "@/lib/auth";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(_: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const result = await loginWithCredentials(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect(next || (result.role === "admin" ? "/settings" : result.role === "private" ? "/private" : "/shared"));
}

export async function logoutAction() {
  await logoutCurrentUser();
  redirect("/");
}
