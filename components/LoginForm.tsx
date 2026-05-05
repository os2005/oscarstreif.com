"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/login/actions";
import { FormMessage } from "./FormMessage";

const initialState: LoginActionState = {};

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      <input name="next" type="hidden" value={next ?? ""} />
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="email">
          Email
        </label>
        <input
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/58" htmlFor="password">
          Password
        </label>
        <input
          className="w-full border border-ink/18 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-accent"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button
        className="border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
