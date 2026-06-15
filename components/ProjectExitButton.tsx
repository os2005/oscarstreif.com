"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProjectExitButtonProps = {
  href: string;
  label?: string;
};

const DISARM_DELAY_MS = 2600;

export function ProjectExitButton({ href, label = "Return to project overview" }: ProjectExitButtonProps) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) {
      return;
    }

    const timeoutId = window.setTimeout(() => setArmed(false), DISARM_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [armed]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setArmed(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      aria-label={armed ? `${label}. Press again to confirm.` : label}
      aria-pressed={armed}
      className={`fixed bottom-5 right-5 z-[80] grid place-items-center rounded-full border shadow-[0_16px_42px_rgba(0,0,0,0.18)] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
        armed ? "h-14 w-14" : "h-10 w-10"
      } ${
        armed
          ? "border-red-200 bg-red-50 focus-visible:outline-red-500 hover:bg-red-100"
          : "border-neutral-300 bg-white/92 focus-visible:outline-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
      }`}
      onClick={() => {
        if (armed) {
          router.push(href);
          return;
        }

        setArmed(true);
      }}
      type="button"
    >
      <span className="sr-only">{armed ? "Confirm return" : label}</span>
      <span
        aria-hidden="true"
        className={`absolute h-0.5 rounded-full transition ${
          armed ? "w-6 rotate-45 bg-red-600" : "w-4 rotate-45 bg-neutral-500"
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute h-0.5 rounded-full transition ${
          armed ? "w-6 -rotate-45 bg-red-600" : "w-4 -rotate-45 bg-neutral-500"
        }`}
      />
    </button>
  );
}
