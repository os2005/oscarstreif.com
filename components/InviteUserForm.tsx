"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvitationAction, type InviteActionState } from "@/app/private/actions";
import { FormMessage } from "./FormMessage";

const initialState: InviteActionState = {};

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(createInvitationAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.credentials) {
      router.refresh();
    }
  }, [router, state.credentials]);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-paper/58" htmlFor="invite-email">
          Email
        </label>
        <input
          className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
          id="invite-email"
          name="email"
          type="email"
          required
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-paper/58" htmlFor="invite-role">
          Access level
        </label>
        <select
          className="w-full rounded-2xl border border-paper/14 bg-black/55 px-4 py-3 text-base text-paper outline-none transition focus:border-paper/36"
          defaultValue="shared"
          id="invite-role"
          name="role"
        >
          <option value="shared">Shared</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        className="rounded-2xl border border-paper/16 bg-paper px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating..." : "Create invitation"}
      </button>
      {state.credentials ? (
        <div className="rounded-3xl border border-paper/12 bg-white/[0.04] p-4 text-sm leading-7 text-paper">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/58">Invite credentials</p>
          <p className="mt-3">
            <strong>Email:</strong> {state.credentials.email}
          </p>
          <p>
            <strong>Temporary password:</strong> {state.credentials.password}
          </p>
          <p>
            <strong>Role:</strong> {state.credentials.role}
          </p>
        </div>
      ) : null}
    </form>
  );
}
