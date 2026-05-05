import { ProtectedContent } from "@/components/ProtectedContent";
import { getAccessForRole } from "@/lib/auth";

export const metadata = {
  title: "Shared",
};

export default async function SharedPage() {
  const access = await getAccessForRole("shared");

  if (!access) {
    return null;
  }

  return (
    <ProtectedContent
      title="Shared Area"
      description="This area is only visible to invited users."
      label="Protected"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="border border-paper/14 bg-white/5 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/48">Chat structure</p>
          <h2 className="mt-4 font-display text-3xl">Shared workspace scaffold</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-paper/70">
            This protected section is structured so a real shared chat, messages, threads and member-specific tools can
            be added here later without changing the access model again.
          </p>
        </div>
        <div className="border border-paper/14 bg-white/5 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/48">Members</p>
          <p className="mt-4 text-base leading-7 text-paper/70">
            Signed in as <span className="text-paper">{access.user.email}</span>.
          </p>
          <p className="mt-2 text-base leading-7 text-paper/58">Role: {access.user.role === "admin" ? "Admin" : "Shared user"}</p>
        </div>
      </div>
    </ProtectedContent>
  );
}
