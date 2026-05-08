"use client";

type ControlCenterAccordionProps = {
  children: React.ReactNode;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
};

export function ControlCenterAccordion({
  children,
  isOpen,
  label,
  onToggle,
}: ControlCenterAccordionProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-paper/12 bg-black/20">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.035] md:px-6"
        onClick={onToggle}
        type="button"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/72">{label}</span>
        <span className="font-mono text-lg leading-none text-paper/54">{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen ? <div className="border-t border-paper/10 px-5 py-5 md:px-6 md:py-6">{children}</div> : null}
    </div>
  );
}
