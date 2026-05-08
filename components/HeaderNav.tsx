"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

type HeaderNavProps = {
  isDark: boolean;
  isLanding: boolean;
  role: "admin" | "shared" | null;
};

const publicLinks = [
  { href: "/me", label: "Me" },
  { href: "/projects", label: "Projects" },
  { href: "/cv", label: "CV" },
];

function getActiveKey(pathname: string) {
  if (pathname.startsWith("/shared")) return "/shared";
  if (pathname.startsWith("/private") || pathname.startsWith("/settings")) return "/private";
  if (pathname.startsWith("/projects")) return "/projects";
  if (pathname.startsWith("/me")) return "/me";
  if (pathname.startsWith("/cv")) return "/cv";
  if (pathname.startsWith("/login")) return "/login";
  return "";
}

export function HeaderNav({ isDark, isLanding, role }: HeaderNavProps) {
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);
  const memberLinks =
    role === "admin"
      ? [
          { href: "/shared", label: "Shared" },
          { href: "/private", label: "Private" },
        ]
      : role === "shared"
        ? [{ href: "/shared", label: "Shared" }]
        : [];

  const textBase = isLanding ? "text-white/78 hover:text-white" : isDark ? "text-paper/78 hover:text-white" : "text-ink/78 hover:text-ink";
  const activeText = "text-accent";
  const memberActive = "bg-accent text-white shadow-[0_0_24px_rgba(20,92,255,0.24)]";

  return (
    <div className="flex items-center gap-5 md:gap-8">
      <div className="flex items-center gap-4 md:gap-6">
        {[...publicLinks, ...(role ? [] : [{ href: "/login", label: "Login" }])].map((link) => (
          <Link
            className={`transition ${activeKey === link.href ? activeText : textBase}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {role ? (
        <div
          className={`hidden items-center gap-1 rounded-full border px-2 py-1 md:flex ${
            isDark ? "border-paper/18 bg-black/25 backdrop-blur" : "border-ink/16 bg-white/70 backdrop-blur"
          }`}
        >
          {memberLinks.map((link) => (
            <Link
              className={`rounded-full px-4 py-2 transition ${
                activeKey === link.href
                  ? memberActive
                  : isDark
                    ? "text-paper/78 hover:bg-white/6 hover:text-white"
                    : "text-ink/78 hover:bg-ink/5 hover:text-ink"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <div className={isDark ? "text-paper/78 hover:text-white" : "text-ink/78 hover:text-ink"}>
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
