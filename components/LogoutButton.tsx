"use client";

import { useActionState } from "react";
import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  const [, formAction, pending] = useActionState(logoutAction, undefined);

  return (
    <form action={formAction}>
      <button
        className="transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Logging out..." : "Logout"}
      </button>
    </form>
  );
}
