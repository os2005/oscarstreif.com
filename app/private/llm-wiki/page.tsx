import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getAccessForRole } from "@/lib/auth";
import { LlmWikiIngestWorkspace } from "@/projects/llm-wiki/LlmWikiIngestWorkspace";
import { LlmWikiWorkspace } from "@/projects/llm-wiki/LlmWikiWorkspace";
import { getInboxSnapshot, getWikiSnapshot } from "@/projects/llm-wiki/server/wiki-store";

export const metadata = {
  title: "LLM Wiki",
};

const LLM_WIKI_UI_VERSION = "view-redesign-2026-05-30";

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
    <WorkspaceShell active="llm-wiki" eyebrow="Private Knowledge Workspace" title="LLM Wiki">
      <div data-llm-wiki-ui-version={LLM_WIKI_UI_VERSION}>
        {isWikiView ? (
          <LlmWikiWorkspace openEntryInModal={Boolean(params.file || params.kind)} snapshot={getWikiSnapshot(params)} />
        ) : (
          <LlmWikiIngestWorkspace inbox={getInboxSnapshot()} />
        )}
      </div>
    </WorkspaceShell>
  );
}
