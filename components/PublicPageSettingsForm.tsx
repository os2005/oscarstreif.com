"use client";

import { useActionState } from "react";
import { updatePublicPageSettingsAction, type PublicPageSettingsActionState } from "@/app/private/actions";
import type { PublicPageSettings } from "@/lib/public-page-settings";
import { FormMessage } from "./FormMessage";

type PublicPageSettingsFormProps = {
  settings: PublicPageSettings;
};

const initialState: PublicPageSettingsActionState = {};

const pages: { key: keyof PublicPageSettings; label: string; description: string }[] = [
  {
    key: "me",
    label: "Me",
    description: "Show the public About page instead of Soon.",
  },
  {
    key: "projects",
    label: "Projects",
    description: "Show the public Open Projects page instead of Soon.",
  },
  {
    key: "cv",
    label: "CV",
    description: "Show the public CV page instead of Soon.",
  },
];

export function PublicPageSettingsForm({ settings }: PublicPageSettingsFormProps) {
  const [state, formAction, pending] = useActionState(updatePublicPageSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FormMessage kind="error">{state.error}</FormMessage> : null}
      {state.success ? <FormMessage kind="success">{state.success}</FormMessage> : null}

      <div className="grid gap-3">
        {pages.map((page) => (
          <label
            className="flex cursor-pointer flex-col gap-4 rounded-3xl border border-paper/12 bg-black/20 p-5 transition hover:border-paper/24 md:flex-row md:items-center md:justify-between"
            htmlFor={`public-page-${page.key}`}
            key={page.key}
          >
            <span>
              <span className="block text-lg text-paper">{page.label}</span>
              <span className="mt-1 block text-sm leading-6 text-paper/54">{page.description}</span>
            </span>
            <span className="relative inline-flex h-8 w-14 shrink-0 items-center">
              <input
                className="peer sr-only"
                defaultChecked={settings[page.key]}
                id={`public-page-${page.key}`}
                name={page.key}
                type="checkbox"
              />
              <span className="absolute inset-0 rounded-full border border-paper/16 bg-black/55 transition peer-checked:border-accent peer-checked:bg-accent" />
              <span className="absolute left-1 h-6 w-6 rounded-full bg-paper transition peer-checked:translate-x-6 peer-checked:bg-white" />
            </span>
          </label>
        ))}
      </div>

      <button
        className="rounded-2xl border border-paper/16 bg-paper px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save visibility"}
      </button>
    </form>
  );
}
