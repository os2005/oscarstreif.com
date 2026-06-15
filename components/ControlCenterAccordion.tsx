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
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-neutral-50 md:px-6"
        onClick={onToggle}
        type="button"
      >
        <span className="text-sm font-semibold text-neutral-900">{label}</span>
        <span className="text-lg leading-none text-neutral-400">{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen ? <div className="border-t border-neutral-200 bg-neutral-50/50 px-5 py-5 md:px-6 md:py-6">{children}</div> : null}
    </div>
  );
}
