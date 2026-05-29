import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";

export function TemplateProjectSharedPage({ project, viewer }: ProjectModuleSharedPageProps) {
  return (
    <main
      className="min-h-dvh bg-[#f4f4f1] px-5 py-6 text-[#171717] md:px-8"
      style={{
        fontFamily:
          "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 border-b border-black/10 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/46">Standalone project module</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">{project.title}</h1>
        </div>
        <p className="hidden text-xs font-semibold text-black/44 sm:block">{viewer?.email ?? "authorized visitor"}</p>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-92px)] w-full max-w-6xl place-items-center py-16">
        <div className="w-full max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/42">Replace this surface</p>
          <h2 className="mt-5 text-[clamp(3rem,9vw,7rem)] font-black leading-[0.9] tracking-tight">
            Build the project as its own site.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/62">
            The platform handles access and runtime metadata. This module owns the visible page, layout, header, colors,
            typography and interactions.
          </p>
        </div>
      </section>
    </main>
  );
}
