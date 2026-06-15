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
            className="flex cursor-pointer flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 text-neutral-950 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 md:flex-row md:items-center md:justify-between"
            htmlFor={`public-page-${page.key}`}
            key={page.key}
          >
            <span>
              <span className="block text-lg font-semibold text-neutral-950">{page.label}</span>
              <span className="mt-1 block text-sm leading-6 text-neutral-600">{page.description}</span>
            </span>
            <span className="relative inline-flex h-8 w-14 shrink-0 items-center">
              <input
                className="peer sr-only"
                defaultChecked={settings[page.key]}
                id={`public-page-${page.key}`}
                name={page.key}
                type="checkbox"
              />
              <span className="absolute inset-0 rounded-full border border-neutral-300 bg-neutral-200 transition peer-checked:border-neutral-950 peer-checked:bg-neutral-950 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-950" />
              <span className="absolute left-1 h-6 w-6 rounded-full bg-white shadow-sm transition peer-checked:translate-x-6 peer-checked:bg-white" />
            </span>
          </label>
        ))}
      </div>

      <button
        className="rounded-2xl border border-neutral-950 bg-neutral-950 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save visibility"}
      </button>
    </form>
  );
}
