"use client";

import { useActionState } from "react";
import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  const [, formAction, pending] = useActionState(logoutAction, undefined);

  return (
    <form action={formAction}>
      <button
        className="rounded-full border border-current/25 px-4 py-2 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Logging out..." : "Logout"}
      </button>
    </form>
  );
}
