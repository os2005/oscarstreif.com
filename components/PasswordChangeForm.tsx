"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordActionState } from "@/app/private/actions";
import { FormMessage } from "./FormMessage";

const initialState: PasswordActionState = {};

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="currentPassword">
          Current password
        </label>
        <input
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="nextPassword">
          New password
        </label>
        <input
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          id="nextPassword"
          name="nextPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <button
        className="border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
