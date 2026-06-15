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
      className="workspace-theme-toggle inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      onClick={() => {
        const nextTheme: WorkspaceTheme = isDark ? "light" : "dark";
        setTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        applyWorkspaceTheme(nextTheme);
      }}
      suppressHydrationWarning
      type="button"
    >
      <span className={`workspace-theme-toggle__option ${!isDark ? "workspace-theme-toggle__option-active" : ""}`}>
        Light
      </span>
      <span className={`workspace-theme-toggle__option ${isDark ? "workspace-theme-toggle__option-active" : ""}`}>
        Dark
      </span>
    </button>
  );
}
