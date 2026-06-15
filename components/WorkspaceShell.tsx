import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { WorkspaceThemeToggle } from "./WorkspaceThemeToggle";

type WorkspaceShellProps = {
  active: "private" | "shared" | "llm-wiki";
  children: React.ReactNode;
  eyebrow: string;
  title: string;
};

const workspaceLinks = [
  { href: "/private", label: "Private", key: "private" },
  { href: "/shared", label: "Shared", key: "shared" },
  { href: "/private/llm-wiki", label: "LLM Wiki", key: "llm-wiki" },
] as const;

export function WorkspaceShell({ active, children, eyebrow, title }: WorkspaceShellProps) {
  return (
    <main className="private-workspace-light min-h-dvh bg-[#f5f5f7] text-[#1d1d1f]" data-workspace-shell="true">
      <header className="border-b border-neutral-200/80 bg-white">
        <nav className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="text-sm font-semibold tracking-tight text-neutral-950" href="/">
              Oscar Streif
            </Link>
            <div className="mt-5">
              <p className="text-sm font-medium text-neutral-500">{eyebrow}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">{title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {workspaceLinks.map((link) => {
              const isActive = active === link.key;

              return (
                <Link
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                  href={link.href}
                  key={link.key}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="rounded-full border border-neutral-200 bg-white px-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <LogoutButton />
            </div>
            <WorkspaceThemeToggle />
          </div>
        </nav>
      </header>
      {children}
    </main>
  );
}
