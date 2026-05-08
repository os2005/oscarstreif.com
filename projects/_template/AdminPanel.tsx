import type { ProjectModuleAdminPanelProps } from "@/lib/project-modules/types";

export function TemplateProjectAdminPanel({ project }: ProjectModuleAdminPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-paper/12 bg-black/18 p-5 text-paper">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46">Optional module admin panel</p>
      <p className="mt-3 text-sm leading-6 text-paper/68">
        Add project-specific controls here if <strong>{project.title}</strong> needs settings beyond the shared platform
        fields.
      </p>
    </section>
  );
}
