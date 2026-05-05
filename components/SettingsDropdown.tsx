"use client";

import Link from "next/link";
import { useState } from "react";

type SettingsDropdownProps = {
  activeSection: "overview" | "password" | "invite" | "members";
};

const items = [
  { id: "password", label: "Change Password" },
  { id: "invite", label: "Create Invitation" },
  { id: "members", label: "Manage Members" },
] as const;

export function SettingsDropdown({ activeSection }: SettingsDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        className="rounded-full border border-paper/18 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition hover:border-paper/40 hover:bg-white/5"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        Settings
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-[220px] border border-paper/14 bg-ink/95 p-2 backdrop-blur">
          {items.map((item) => (
            <Link
              className={`block px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition hover:bg-white/5 ${
                activeSection === item.id ? "text-white" : "text-paper/68"
              }`}
              href={`/private?section=${item.id}`}
              key={item.id}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
