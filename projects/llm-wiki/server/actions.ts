"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAccessForRole } from "@/lib/auth";
import {
  addRawSource,
  createFileInboxItem,
  createTextInboxItem,
  processPendingInboxItems,
  runWikiLint,
  updateExistingEntry,
  upsertWikiPage,
  type WikiEntryKind,
} from "./wiki-store";

const WIKI_ROUTE = "/private/llm-wiki";

async function requireAdminAccess() {
  const access = await getAccessForRole("admin");

  if (!access?.allowed) {
    redirect(`/login?next=${encodeURIComponent(WIKI_ROUTE)}`);
  }
}

function redirectToEntry(kind: WikiEntryKind, file: string) {
  revalidatePath(WIKI_ROUTE);
  redirect(`${WIKI_ROUTE}?view=wiki&kind=${encodeURIComponent(kind)}&file=${encodeURIComponent(file)}`);
}

function redirectToIngest() {
  revalidatePath(WIKI_ROUTE);
  redirect(WIKI_ROUTE);
}

export async function createWikiPageAction(formData: FormData) {
  await requireAdminAccess();

  const title = String(formData.get("title") ?? "");
  const filePath = String(formData.get("filePath") ?? "");
  const content = String(formData.get("content") ?? "");
  const result = upsertWikiPage({ content, path: filePath, title });

  redirectToEntry("wiki", result.path);
}

export async function saveWikiEntryAction(formData: FormData) {
  await requireAdminAccess();

  const kind = String(formData.get("kind") ?? "wiki");
  const filePath = String(formData.get("filePath") ?? "");
  const content = String(formData.get("content") ?? "");

  if (kind !== "schema" && kind !== "wiki") {
    redirectToEntry("wiki", "index.md");
  }

  const result = updateExistingEntry({
    content,
    kind: kind as WikiEntryKind,
    path: filePath,
  });

  redirectToEntry(result.kind, result.path);
}

export async function addRawSourceAction(formData: FormData) {
  await requireAdminAccess();

  const fileValue = formData.get("sourceFile");
  const file = typeof File !== "undefined" && fileValue instanceof File ? fileValue : null;
  const sourcePath = String(formData.get("sourcePath") ?? "");
  const text = String(formData.get("sourceText") ?? "");
  const title = String(formData.get("title") ?? "");
  const result = await addRawSource({ file, sourcePath, text, title });

  redirectToEntry("wiki", result.sourcePagePath);
}

export async function submitInboxItemAction(formData: FormData) {
  await requireAdminAccess();

  const title = String(formData.get("title") ?? "");
  const text = String(formData.get("text") ?? "");
  const kind = String(formData.get("kind") ?? "file");
  const fileValue = formData.get("sourceFile");
  const file = typeof File !== "undefined" && fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  let created = false;

  if (text.trim()) {
    const result = createTextInboxItem({ text, title });
    created = result.ok || created;
  }

  if (file) {
    const result = await createFileInboxItem({
      file,
      kind: kind === "voice" ? "voice" : "file",
      title,
    });
    created = result.ok || created;
  }

  if (!created) {
    redirectToIngest();
  }

  redirectToIngest();
}

export async function processPendingInboxAction() {
  await requireAdminAccess();

  processPendingInboxItems();
  redirectToIngest();
}

export async function runWikiLintAction() {
  await requireAdminAccess();

  const result = runWikiLint();
  redirectToEntry("wiki", result.reportPath);
}
