import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const publicLinks = [
  { href: "/me", label: "Me" },
  { href: "/projects", label: "Projects" },
  { href: "/cv", label: "CV" },
  { href: "/login", label: "Login" },
];

type HeaderProps = {
  variant?: "light" | "dark" | "landing";
};

export async function Header({ variant = "light" }: HeaderProps) {
  const user = await getCurrentUser();
  const isDark = variant === "dark" || variant === "landing";
  const isLanding = variant === "landing";
  const memberLinks =
    user?.role === "admin"
      ? [
          { href: "/shared", label: "Shared" },
          { href: "/private", label: "Private" },
          { href: "/settings", label: "Settings" },
        ]
      : user?.role === "shared"
        ? [{ href: "/shared", label: "Shared" }]
        : [];

  return (
    <header
      className={`site-header z-40 w-full px-5 py-5 md:px-8 ${
        isLanding ? "absolute left-0 top-0" : "relative"
      } ${isDark ? "text-paper" : "text-ink"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link className={`transition hover:text-white ${isLanding ? "text-white/82" : ""}`} href="/">
          Oscar Streif
        </Link>
        <div className="flex items-center gap-5 md:gap-8">
          <div className="flex items-center gap-4 md:gap-6">
            {publicLinks.map((link) => (
              <Link className={`transition hover:text-white ${isLanding ? "text-white/78" : ""}`} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          {user ? (
            <div className={`hidden items-center gap-4 md:flex ${isDark ? "text-paper/52" : "text-ink/52"}`}>
              {memberLinks.map((link) => (
                <Link className="transition hover:text-white" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <span className={isDark ? "text-paper/34" : "text-ink/34"}>{user.email}</span>
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
