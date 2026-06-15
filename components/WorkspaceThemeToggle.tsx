"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "oscar-workspace-theme";

type WorkspaceTheme = "light" | "dark";

function applyWorkspaceTheme(theme: WorkspaceTheme) {
  document.documentElement.dataset.workspaceTheme = theme;
}

export function WorkspaceThemeToggle() {
  const [theme, setTheme] = useState<WorkspaceTheme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyWorkspaceTheme(theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} workspace mode`}
      aria-pressed={isDark}
      className="workspace-theme-toggle group relative inline-grid h-11 w-11 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-950 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      onClick={() => {
        const nextTheme: WorkspaceTheme = isDark ? "light" : "dark";
        setTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        applyWorkspaceTheme(nextTheme);
      }}
      suppressHydrationWarning
      type="button"
    >
      <span className="sr-only">{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
      <span aria-hidden="true" className="workspace-theme-toggle__icon workspace-theme-toggle__icon-sun">
        <span className="workspace-theme-toggle__sun-core" />
        <span className="workspace-theme-toggle__sun-ray workspace-theme-toggle__sun-ray-1" />
        <span className="workspace-theme-toggle__sun-ray workspace-theme-toggle__sun-ray-2" />
        <span className="workspace-theme-toggle__sun-ray workspace-theme-toggle__sun-ray-3" />
        <span className="workspace-theme-toggle__sun-ray workspace-theme-toggle__sun-ray-4" />
      </span>
      <span aria-hidden="true" className="workspace-theme-toggle__icon workspace-theme-toggle__icon-moon">
        <span className="workspace-theme-toggle__moon" />
        <span className="workspace-theme-toggle__star workspace-theme-toggle__star-1" />
        <span className="workspace-theme-toggle__star workspace-theme-toggle__star-2" />
      </span>
    </button>
  );
}
