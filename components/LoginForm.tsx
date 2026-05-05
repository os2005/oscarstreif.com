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
    <form
      action={formAction}
      className="space-y-5 rounded-[28px] border border-white/12 bg-white/[0.055] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      <input name="next" type="hidden" value={next ?? ""} />
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-white/58" htmlFor="email">
          E-Mail
        </label>
        <input
          className="w-full rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/34 focus:border-white/40"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-white/58" htmlFor="password">
          Password
        </label>
        <input
          className="w-full rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/34 focus:border-white/40"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button
        className="w-full rounded-2xl border border-white/16 bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
