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
      className={`fixed bottom-5 right-5 z-[80] grid place-items-center rounded-full border border-white/12 bg-black shadow-[0_16px_42px_rgba(0,0,0,0.24)] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 ${
        armed ? "h-14 w-14" : "h-10 w-10"
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
          armed ? "w-6 rotate-45 bg-red-500" : "w-4 rotate-45 bg-white/34"
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute h-0.5 rounded-full transition ${
          armed ? "w-6 -rotate-45 bg-red-500" : "w-4 -rotate-45 bg-white/34"
        }`}
      />
    </button>
  );
}
