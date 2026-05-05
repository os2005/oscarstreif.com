"use client";

import { useActionState } from "react";
import { createInvitationAction, type InviteActionState } from "@/app/settings/actions";
import { FormMessage } from "./FormMessage";

const initialState: InviteActionState = {};

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(createInvitationAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="invite-email">
          Email
        </label>
        <input
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          id="invite-email"
          name="email"
          type="email"
          required
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="invite-role">
          Access level
        </label>
        <select
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          defaultValue="shared"
          id="invite-role"
          name="role"
        >
          <option value="shared">Shared</option>
          <option value="private">Private</option>
        </select>
      </div>
      <button
        className="border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating..." : "Create invitation"}
      </button>
      {state.credentials ? (
        <div className="border border-ink/15 bg-paper p-4 text-sm leading-7 text-ink">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/58">Invite credentials</p>
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
