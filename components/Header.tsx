import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { HeaderNav } from "./HeaderNav";

type HeaderProps = {
  variant?: "light" | "dark" | "landing";
};

export async function Header({ variant = "light" }: HeaderProps) {
  const user = await getCurrentUser();
  const isDark = variant === "dark" || variant === "landing";
  const isLanding = variant === "landing";

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
        <HeaderNav isDark={isDark} isLanding={isLanding} role={user?.role ?? null} />
      </nav>
    </header>
  );
}
