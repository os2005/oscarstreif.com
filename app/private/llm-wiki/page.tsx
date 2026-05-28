import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { Header } from "@/components/Header";
import { getAccessForRole } from "@/lib/auth";
import { LlmWikiIngestWorkspace } from "@/projects/llm-wiki/LlmWikiIngestWorkspace";
import { LlmWikiWorkspace } from "@/projects/llm-wiki/LlmWikiWorkspace";
import { getInboxSnapshot, getWikiSnapshot } from "@/projects/llm-wiki/server/wiki-store";

export const metadata = {
  title: "LLM Wiki",
};

type LlmWikiPageProps = {
  searchParams: Promise<{
    file?: string;
    kind?: string;
    q?: string;
    view?: string;
  }>;
};

export default async function LlmWikiPage({ searchParams }: LlmWikiPageProps) {
  const access = await getAccessForRole("admin");

  if (!access) {
    redirect("/login?next=%2Fprivate%2Fllm-wiki");
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const isWikiView = params.view === "wiki";

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <Header variant="dark" />
      {isWikiView ? <LlmWikiWorkspace snapshot={getWikiSnapshot(params)} /> : <LlmWikiIngestWorkspace inbox={getInboxSnapshot()} />}
    </main>
  );
}
