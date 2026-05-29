import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { APP_DATA_DIR } from "@/lib/auth-config";
import { writeFileAtomic } from "@/lib/atomic-file";

export type WikiEntryKind = "raw" | "schema" | "wiki";

export type InboxItemKind = "file" | "text" | "voice";

export type InboxItemStatus = "failed" | "manual-review" | "pending" | "processed" | "processing";

export type InboxItemSummary = {
  createdAt: string;
  error?: string;
  id: string;
  kind: InboxItemKind;
  metadataPath: string;
  mimeType?: string;
  originalFilename?: string;
  processedAt?: string;
  size: number;
  sourcePath: string;
  status: InboxItemStatus;
  title: string;
};

export type InboxSnapshot = {
  failedCount: number;
  hasApiKey: boolean;
  items: InboxItemSummary[];
  model: string;
  pendingCount: number;
  processedCount: number;
  processingCount: number;
};

export type WikiSearchMatch = {
  line: number;
  text: string;
};

export type WikiFileSummary = {
  category: string;
  excerpt: string;
  kind: WikiEntryKind;
  matchCount?: number;
  matches?: WikiSearchMatch[];
  path: string;
  size: number;
  title: string;
  updatedAt: string;
};

export type WikiGraphEdge = {
  from: string;
  to: string;
};

export type WikiGraphNode = {
  category: string;
  inbound: number;
  outbound: number;
  path: string;
  relevance: number;
  title: string;
};

export type WikiSnapshot = {
  files: WikiFileSummary[];
  graph: {
    edges: WikiGraphEdge[];
    maxInbound: number;
    nodes: WikiGraphNode[];
  };
  query: string;
  rawFiles: WikiFileSummary[];
  schema: WikiFileSummary;
  searchResults: WikiFileSummary[];
  selected: {
    canEdit: boolean;
    content: string;
    kind: WikiEntryKind;
    path: string;
    title: string;
  };
  stats: {
    lastUpdated: string | null;
    rawCount: number;
    wikiCount: number;
  };
};

const WIKI_ROOT_NAME = "llm-wiki";
const WIKI_DIR_NAME = "wiki";
const RAW_DIR_NAME = "raw";
const INBOX_DIR_NAME = "inbox";
const SCHEMA_FILENAME = "schema.md";
const DEFAULT_WIKI_FILE = "index.md";
const GENERATED_CATALOG_START = "<!-- llm-wiki:catalog:start -->";
const GENERATED_CATALOG_END = "<!-- llm-wiki:catalog:end -->";
const INBOX_STATUS_DIRS = ["pending", "processing", "processed", "failed"] as const;

const TEXT_EXTENSIONS = new Set([
  ".csv",
  ".html",
  ".json",
  ".log",
  ".md",
  ".mdx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

function resolveAppDataDir() {
  return path.isAbsolute(APP_DATA_DIR)
    ? APP_DATA_DIR
    : path.join(/* turbopackIgnore: true */ process.cwd(), APP_DATA_DIR);
}

export function getLlmWikiRoot() {
  return path.join(resolveAppDataDir(), WIKI_ROOT_NAME);
}

function getWikiDir() {
  return path.join(getLlmWikiRoot(), WIKI_DIR_NAME);
}

function getRawDir() {
  return path.join(getLlmWikiRoot(), RAW_DIR_NAME);
}

function getInboxDir(status?: (typeof INBOX_STATUS_DIRS)[number]) {
  return status ? path.join(getLlmWikiRoot(), INBOX_DIR_NAME, status) : path.join(getLlmWikiRoot(), INBOX_DIR_NAME);
}

function getSchemaPath() {
  return path.join(getLlmWikiRoot(), SCHEMA_FILENAME);
}

function nowIso() {
  return new Date().toISOString();
}

function formatDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function ensureDir(directory: string) {
  mkdirSync(directory, { recursive: true });
}

function ensureParentDir(filePath: string) {
  ensureDir(path.dirname(filePath));
}

function stripFrontmatter(contents: string) {
  return contents.replace(/^---[\s\S]*?---\s*/m, "");
}

function stripMarkdown(contents: string) {
  return stripFrontmatter(contents)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|#]+)(?:[|#][^\]]*)?]]/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromPath(relativePath: string) {
  const basename = path.posix.basename(relativePath, path.posix.extname(relativePath));
  return basename
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractTitle(contents: string, relativePath: string) {
  const frontmatterTitle = contents.match(/^---[\s\S]*?\ntitle:\s*["']?([^"'\n]+)["']?\n[\s\S]*?---/m)?.[1];
  if (frontmatterTitle?.trim()) {
    return frontmatterTitle.trim();
  }

  const heading = stripFrontmatter(contents).match(/^#\s+(.+)$/m)?.[1];
  if (heading?.trim()) {
    return heading.trim();
  }

  return titleFromPath(relativePath);
}

function excerptFromContent(contents: string) {
  const plain = stripMarkdown(contents);
  return plain.length > 180 ? `${plain.slice(0, 177)}...` : plain;
}

function toPosixPath(value: string) {
  return value.replace(/\\/g, "/");
}

function isUnsafePath(relativePath: string) {
  if (!relativePath || relativePath === "." || relativePath === "..") return true;
  if (path.isAbsolute(relativePath)) return true;
  if (/^[a-zA-Z]:/.test(relativePath)) return true;

  const parts = toPosixPath(relativePath).split("/");
  return parts.some((part) => part === ".." || part === "");
}

function normalizeExistingRelativePath(input: string | undefined, fallback: string) {
  const cleaned = toPosixPath(String(input ?? "").trim()).replace(/^\/+/, "");
  const normalized = path.posix.normalize(cleaned || fallback);
  return isUnsafePath(normalized) ? fallback : normalized;
}

function slugifySegment(segment: string) {
  const extension = path.posix.extname(segment);
  const basename = extension ? segment.slice(0, -extension.length) : segment;
  const slug = basename
    .normalize("NFKD")
    .replace(/[^\w .-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  const safeExtension = extension.replace(/[^\w.]/g, "").toLowerCase();
  return `${slug || "untitled"}${safeExtension}`;
}

function normalizeNewRelativePath(input: string, fallbackName: string, extension = ".md") {
  const candidate = toPosixPath(input.trim() || fallbackName).replace(/^\/+/, "");
  const withExtension = path.posix.extname(candidate) ? candidate : `${candidate}${extension}`;
  const segments = path.posix
    .normalize(withExtension)
    .split("/")
    .filter(Boolean)
    .map(slugifySegment);
  const normalized = segments.join("/");

  if (isUnsafePath(normalized)) {
    throw new Error("Please provide a safe relative path.");
  }

  return normalized;
}

function safeResolve(baseDir: string, relativePath: string) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(resolvedBase, relativePath);
  const relative = path.relative(resolvedBase, resolvedPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escapes the LLM Wiki data directory.");
  }

  return resolvedPath;
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function isTextLike(relativePath: string) {
  return TEXT_EXTENSIONS.has(path.posix.extname(relativePath).toLowerCase());
}

function readTextFile(baseDir: string, relativePath: string) {
  if (!isTextLike(relativePath)) {
    return "";
  }

  const targetPath = safeResolve(baseDir, relativePath);
  if (!existsSync(targetPath)) return "";
  return readFileSync(targetPath, "utf8");
}

function readDisplayContent(kind: WikiEntryKind, relativePath: string) {
  if (kind === "schema") {
    return readFileSync(getSchemaPath(), "utf8");
  }

  const baseDir = kind === "raw" ? getRawDir() : getWikiDir();
  if (!isTextLike(relativePath)) {
    return [
      `# ${titleFromPath(relativePath)}`,
      "",
      "This source is stored as a binary or unsupported text format.",
      "",
      `Path: \`${relativePath}\``,
    ].join("\n");
  }

  return readTextFile(baseDir, relativePath);
}

function walkFiles(baseDir: string, relativeDir = ""): string[] {
  if (!existsSync(baseDir)) return [];

  const currentDir = relativeDir ? path.join(baseDir, relativeDir) : baseDir;
  return readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = relativeDir ? path.posix.join(toPosixPath(relativeDir), entry.name) : entry.name;

    if (entry.isDirectory()) {
      return walkFiles(baseDir, entryPath);
    }

    if (!entry.isFile()) {
      return [];
    }

    return [entryPath];
  });
}

function summarizeFile(baseDir: string, relativePath: string, kind: WikiEntryKind): WikiFileSummary {
  const targetPath = safeResolve(baseDir, relativePath);
  const stats = statSync(targetPath);
  const contents = isTextLike(relativePath) ? readFileSync(targetPath, "utf8") : "";
  const category = relativePath.includes("/") ? relativePath.split("/")[0] : "root";

  return {
    category,
    excerpt: contents ? excerptFromContent(contents) : "Stored file",
    kind,
    path: relativePath,
    size: stats.size,
    title: contents ? extractTitle(contents, relativePath) : titleFromPath(relativePath),
    updatedAt: stats.mtime.toISOString(),
  };
}

function listWikiSummaries() {
  return walkFiles(getWikiDir())
    .filter((filePath) => filePath.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right))
    .map((filePath) => summarizeFile(getWikiDir(), filePath, "wiki"));
}

function listRawSummaries() {
  return walkFiles(getRawDir())
    .sort((left, right) => left.localeCompare(right))
    .map((filePath) => summarizeFile(getRawDir(), filePath, "raw"));
}

function appendLog(kind: string, title: string, details: string[] = []) {
  const logPath = safeResolve(getWikiDir(), "log.md");
  const current = existsSync(logPath) ? readFileSync(logPath, "utf8").trimEnd() : "# Log";
  const detailLines = details.length ? `\n\n${details.map((detail) => `- ${detail}`).join("\n")}` : "";
  const entry = `\n\n## [${formatDateStamp()}] ${kind} | ${title}${detailLines}\n`;
  writeFileAtomic(logPath, `${current}${entry}`);
}

function refreshGeneratedCatalog() {
  const indexPath = safeResolve(getWikiDir(), DEFAULT_WIKI_FILE);
  const current = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : starterIndexContent();
  const wikiPages = listWikiSummaries().filter((file) => file.path !== DEFAULT_WIKI_FILE && file.path !== "log.md");
  const rawSources = listRawSummaries();
  const catalog = [
    GENERATED_CATALOG_START,
    "",
    "## Generated Catalog",
    "",
    "### Wiki Pages",
    "",
    wikiPages.length
      ? wikiPages.map((file) => `- [[${file.path}|${file.title}]] - ${file.excerpt || "No excerpt yet."}`).join("\n")
      : "- No wiki pages yet.",
    "",
    "### Raw Sources",
    "",
    rawSources.length
      ? rawSources.map((file) => `- \`raw/${file.path}\` - ${file.title}`).join("\n")
      : "- No raw sources yet.",
    "",
    GENERATED_CATALOG_END,
  ].join("\n");

  const next = current.includes(GENERATED_CATALOG_START) && current.includes(GENERATED_CATALOG_END)
    ? current.replace(
        new RegExp(`${GENERATED_CATALOG_START}[\\s\\S]*?${GENERATED_CATALOG_END}`),
        catalog
      )
    : `${current.trimEnd()}\n\n${catalog}\n`;

  writeFileAtomic(indexPath, next.endsWith("\n") ? next : `${next}\n`);
}

function starterSchemaContent() {
  return [
    "# LLM Wiki Schema",
    "",
    "This file defines the operating rules for the LLM-maintained wiki.",
    "",
    "## Layers",
    "",
    "- `raw/` contains immutable source material. Do not edit source files during wiki maintenance.",
    "- `wiki/` contains maintained Markdown pages. The LLM may create and update these files.",
    "- `schema.md` contains conventions, workflows and maintenance rules.",
    "",
    "## Page Conventions",
    "",
    "- Use concise titles with one `#` heading.",
    "- Prefer Obsidian-style links like `[[topics/example.md|Example]]` for internal references.",
    "- Put source-specific notes in `wiki/sources/`.",
    "- Put concepts in `wiki/topics/` and people or organizations in `wiki/entities/`.",
    "- Flag unresolved contradictions with a `## Tensions` section.",
    "- Preserve uncertainty instead of smoothing it away.",
    "",
    "## Workflows",
    "",
    "### Ingest",
    "",
    "1. Read the new file in `raw/`.",
    "2. Create or update the matching page in `wiki/sources/`.",
    "3. Update relevant topic and entity pages.",
    "4. Update `wiki/index.md` where human-facing navigation needs refinement.",
    "5. Append an entry to `wiki/log.md`.",
    "",
    "### Query",
    "",
    "1. Read `wiki/index.md` first.",
    "2. Search relevant wiki pages.",
    "3. Answer with citations to wiki pages and raw sources where useful.",
    "4. File durable analysis back into `wiki/` when it should compound.",
    "",
    "### Lint",
    "",
    "- Check unresolved links, orphan pages and pages missing from the index.",
    "- Write findings to `wiki/maintenance/wiki-health.md`.",
  ].join("\n");
}

function starterIndexContent() {
  return [
    "# LLM Wiki Index",
    "",
    "This index is the first page to read before answering questions against the wiki.",
    "",
    GENERATED_CATALOG_START,
    "",
    "## Generated Catalog",
    "",
    "### Wiki Pages",
    "",
    "- No wiki pages yet.",
    "",
    "### Raw Sources",
    "",
    "- No raw sources yet.",
    "",
    GENERATED_CATALOG_END,
    "",
    "## Curated Navigation",
    "",
    "- [[log.md|Log]]",
  ].join("\n");
}

function starterLogContent() {
  return [
    "# Log",
    "",
    `## [${formatDateStamp()}] init | LLM Wiki created`,
    "",
    "- Initialized persistent wiki directories.",
  ].join("\n");
}

function starterHubContent(title: string, body: string) {
  return [
    `# ${title}`,
    "",
    body,
    "",
    "## Linked Notes",
    "",
    "- [[index.md|Index]]",
    "- [[open-loops.md|Open Loops]]",
  ].join("\n");
}

function ensureHubPages() {
  const hubPages = [
    {
      path: "projects.md",
      title: "Projects",
      body: "Project-related notes, ongoing work, ideas and project memory belong here.",
    },
    {
      path: "problems.md",
      title: "Problems",
      body: "Recurring problems, frictions and patterns that need structured follow-up belong here.",
    },
    {
      path: "mentoring.md",
      title: "Mentoring",
      body: "Items to bring into mentoring sessions, coaching conversations or reflective reviews belong here.",
    },
    {
      path: "open-loops.md",
      title: "Open Loops",
      body: "Unresolved tasks, questions, commitments and loose threads belong here.",
    },
    {
      path: "decisions.md",
      title: "Decisions",
      body: "Decisions, tradeoffs and durable conclusions belong here.",
    },
  ];

  for (const hub of hubPages) {
    const targetPath = safeResolve(getWikiDir(), hub.path);
    if (!existsSync(targetPath)) {
      writeFileAtomic(targetPath, `${starterHubContent(hub.title, hub.body)}\n`);
    }
  }
}

function ensureWikiInitialized() {
  const root = getLlmWikiRoot();
  const wikiDir = getWikiDir();
  const rawDir = getRawDir();

  ensureDir(root);
  ensureDir(wikiDir);
  ensureDir(rawDir);
  ensureDir(path.join(wikiDir, "entities"));
  ensureDir(path.join(wikiDir, "maintenance"));
  ensureDir(path.join(wikiDir, "questions"));
  ensureDir(path.join(wikiDir, "sources"));
  ensureDir(path.join(wikiDir, "topics"));
  ensureDir(path.join(rawDir, "assets"));
  ensureDir(path.join(rawDir, "inbox"));
  for (const status of INBOX_STATUS_DIRS) {
    ensureDir(getInboxDir(status));
  }

  const schemaPath = getSchemaPath();
  const indexPath = safeResolve(wikiDir, DEFAULT_WIKI_FILE);
  const logPath = safeResolve(wikiDir, "log.md");

  if (!existsSync(schemaPath)) {
    writeFileAtomic(schemaPath, `${starterSchemaContent()}\n`);
  }

  if (!existsSync(indexPath)) {
    writeFileAtomic(indexPath, `${starterIndexContent()}\n`);
  }

  if (!existsSync(logPath)) {
    writeFileAtomic(logPath, `${starterLogContent()}\n`);
  }

  ensureHubPages();
  refreshGeneratedCatalog();
}

function createSchemaSummary(): WikiFileSummary {
  const schemaPath = getSchemaPath();
  const stats = statSync(schemaPath);
  const contents = readFileSync(schemaPath, "utf8");

  return {
    category: "root",
    excerpt: excerptFromContent(contents),
    kind: "schema",
    path: SCHEMA_FILENAME,
    size: stats.size,
    title: extractTitle(contents, SCHEMA_FILENAME),
    updatedAt: stats.mtime.toISOString(),
  };
}

function findSelectedFile(kind: WikiEntryKind, relativePath: string) {
  if (kind === "schema") {
    return {
      kind,
      path: SCHEMA_FILENAME,
      title: "LLM Wiki Schema",
      content: readDisplayContent(kind, SCHEMA_FILENAME),
      canEdit: true,
    };
  }

  const baseDir = kind === "raw" ? getRawDir() : getWikiDir();
  const fallback = kind === "raw" ? "" : DEFAULT_WIKI_FILE;
  const safePath = normalizeExistingRelativePath(relativePath, fallback);
  const resolved = safePath ? safeResolve(baseDir, safePath) : null;

  if (!resolved || !existsSync(resolved)) {
    return {
      kind: "wiki" as const,
      path: DEFAULT_WIKI_FILE,
      title: "LLM Wiki Index",
      content: readDisplayContent("wiki", DEFAULT_WIKI_FILE),
      canEdit: true,
    };
  }

  const content = readDisplayContent(kind, safePath);
  return {
    kind,
    path: safePath,
    title: extractTitle(content, safePath),
    content,
    canEdit: kind !== "raw" || isTextLike(safePath),
  };
}

function countTermMatches(content: string, term: string) {
  return content.toLowerCase().split(term).length - 1;
}

function searchEntries(query: string, files: WikiFileSummary[], schema: WikiFileSummary) {
  type SearchResult = WikiFileSummary & {
    matchCount: number;
    matches: WikiSearchMatch[];
  };

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (!terms.length) {
    return [];
  }

  const allFiles = [schema, ...files];

  return allFiles
    .map<SearchResult | null>((file) => {
      const baseDir = file.kind === "raw" ? getRawDir() : file.kind === "schema" ? getLlmWikiRoot() : getWikiDir();
      const content = file.kind === "schema"
        ? readFileSync(getSchemaPath(), "utf8")
        : readTextFile(baseDir, file.path);
      const haystack = `${file.title}\n${file.path}\n${content}`.toLowerCase();
      const matches = terms.reduce((score, term) => score + countTermMatches(haystack, term), 0);

      if (!matches) {
        return null;
      }

      const lines = content.split(/\r?\n/);
      const previewMatches = lines
        .map((line, index) => ({ line: index + 1, text: line.trim() }))
        .filter((line) => terms.some((term) => line.text.toLowerCase().includes(term)))
        .slice(0, 3);

      return {
        ...file,
        matchCount: matches,
        matches: previewMatches,
      };
    })
    .filter((file): file is SearchResult => file !== null)
    .sort((left, right) => (right.matchCount ?? 0) - (left.matchCount ?? 0));
}

function getWikiManagerConfig() {
  return {
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.LLM_WIKI_MODEL?.trim() || "gpt-4.1-mini",
  };
}

function sanitizeTitleForFilename(title: string) {
  return slugifySegment(`${title || "untitled"}.md`).replace(/\.md$/, "");
}

function createInboxId(kind: InboxItemKind, title: string) {
  const stamp = nowIso().replace(/[:.]/g, "-");
  return `${stamp}-${kind}-${sanitizeTitleForFilename(title).slice(0, 42)}-${randomUUID().slice(0, 8)}`;
}

function getInboxMetadataPath(status: (typeof INBOX_STATUS_DIRS)[number], id: string) {
  return safeResolve(getInboxDir(status), `${id}.json`);
}

function getRelativeToWikiRoot(absolutePath: string) {
  return toPosixPath(path.relative(getLlmWikiRoot(), absolutePath));
}

function normalizeInboxStatus(value: string | undefined): InboxItemStatus {
  if (
    value === "failed" ||
    value === "manual-review" ||
    value === "pending" ||
    value === "processed" ||
    value === "processing"
  ) {
    return value;
  }

  return "pending";
}

function writeInboxMetadata(item: InboxItemSummary) {
  const targetPath = safeResolve(getLlmWikiRoot(), item.metadataPath);
  ensureParentDir(targetPath);
  writeFileAtomic(targetPath, JSON.stringify(item, null, 2));
}

function readInboxItem(statusDir: (typeof INBOX_STATUS_DIRS)[number], metadataFile: string): InboxItemSummary | null {
  const metadataPath = safeResolve(getInboxDir(statusDir), metadataFile);
  const parsed = readJsonFile<Partial<InboxItemSummary>>(metadataPath);
  if (!parsed?.id || !parsed.sourcePath || !parsed.title || !parsed.kind) {
    return null;
  }

  const sourcePath = String(parsed.sourcePath);
  const sourceAbsolutePath = safeResolve(getLlmWikiRoot(), sourcePath);
  const size = existsSync(sourceAbsolutePath) ? statSync(sourceAbsolutePath).size : 0;

  return {
    id: String(parsed.id),
    createdAt: String(parsed.createdAt ?? nowIso()),
    error: parsed.error ? String(parsed.error) : undefined,
    kind: parsed.kind === "voice" || parsed.kind === "file" || parsed.kind === "text" ? parsed.kind : "text",
    metadataPath: getRelativeToWikiRoot(metadataPath),
    mimeType: parsed.mimeType ? String(parsed.mimeType) : undefined,
    originalFilename: parsed.originalFilename ? String(parsed.originalFilename) : undefined,
    processedAt: parsed.processedAt ? String(parsed.processedAt) : undefined,
    size,
    sourcePath,
    status: normalizeInboxStatus(parsed.status ?? statusDir),
    title: String(parsed.title),
  } satisfies InboxItemSummary;
}

function listInboxItems(): InboxItemSummary[] {
  ensureWikiInitialized();

  return INBOX_STATUS_DIRS.flatMap((status) =>
    walkFiles(getInboxDir(status))
      .filter((filePath) => filePath.endsWith(".json") && !filePath.includes("/"))
      .map((filePath) => readInboxItem(status, filePath))
      .filter((item): item is InboxItemSummary => item !== null)
  ).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getInboxSnapshot(): InboxSnapshot {
  const items = listInboxItems();
  const managerConfig = getWikiManagerConfig();

  return {
    failedCount: items.filter((item) => item.status === "failed").length,
    hasApiKey: managerConfig.hasApiKey,
    items,
    model: managerConfig.model,
    pendingCount: items.filter((item) => item.status === "pending" || item.status === "manual-review").length,
    processedCount: items.filter((item) => item.status === "processed").length,
    processingCount: items.filter((item) => item.status === "processing").length,
  };
}

function createInboxMetadata(input: {
  id: string;
  kind: InboxItemKind;
  mimeType?: string;
  originalFilename?: string;
  sourceAbsolutePath: string;
  title: string;
}): InboxItemSummary {
  const now = nowIso();
  const sourcePath = getRelativeToWikiRoot(input.sourceAbsolutePath);
  const metadataPath = getRelativeToWikiRoot(getInboxMetadataPath("pending", input.id));
  const size = existsSync(input.sourceAbsolutePath) ? statSync(input.sourceAbsolutePath).size : 0;

  return {
    id: input.id,
    createdAt: now,
    kind: input.kind,
    metadataPath,
    mimeType: input.mimeType,
    originalFilename: input.originalFilename,
    processedAt: undefined,
    size,
    sourcePath,
    status: "pending",
    title: input.title,
  };
}

export function createTextInboxItem(input: { text: string; title?: string }) {
  ensureWikiInitialized();

  const text = input.text.trim();
  if (!text) {
    return { ok: false as const, error: "Please add text before submitting." };
  }

  const title = input.title?.trim() || `Text Capture ${formatDateStamp()}`;
  const id = createInboxId("text", title);
  const sourcePath = safeResolve(getInboxDir("pending"), `${id}.md`);
  const contents = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `created: "${nowIso()}"`,
    "kind: text",
    "---",
    "",
    `# ${title}`,
    "",
    text,
  ].join("\n");

  writeFileAtomic(sourcePath, `${contents}\n`);
  const item = createInboxMetadata({
    id,
    kind: "text",
    mimeType: "text/markdown",
    sourceAbsolutePath: sourcePath,
    title,
  });
  writeInboxMetadata(item);
  appendLog("inbox", title, [`Queued text capture: \`${item.sourcePath}\``]);

  return { ok: true as const, item };
}

export async function createFileInboxItem(input: { file: File; kind: InboxItemKind; title?: string }) {
  ensureWikiInitialized();

  if (input.kind !== "file" && input.kind !== "voice") {
    return { ok: false as const, error: "Invalid inbox item type." };
  }

  if (!input.file.size) {
    return { ok: false as const, error: "Please choose a file before submitting." };
  }

  const originalFilename = input.file.name || `${input.kind}-capture`;
  const title = input.title?.trim() || (input.kind === "voice" ? "Voice Capture" : originalFilename);
  const id = createInboxId(input.kind, title);
  const filename = `${id}-${slugifySegment(originalFilename)}`;
  const sourcePath = safeResolve(getInboxDir("pending"), filename);

  writeFileSync(sourcePath, Buffer.from(await input.file.arrayBuffer()));
  const item = createInboxMetadata({
    id,
    kind: input.kind,
    mimeType: input.file.type || undefined,
    originalFilename,
    sourceAbsolutePath: sourcePath,
    title,
  });
  writeInboxMetadata(item);
  appendLog("inbox", title, [`Queued ${input.kind} capture: \`${item.sourcePath}\``]);

  return { ok: true as const, item };
}

function updateInboxItemInPlace(item: InboxItemSummary, updates: Partial<InboxItemSummary>) {
  const nextItem = {
    ...item,
    ...updates,
  };
  writeInboxMetadata(nextItem);
  return nextItem;
}

function moveInboxItem(item: InboxItemSummary, nextStatusDir: (typeof INBOX_STATUS_DIRS)[number], updates: Partial<InboxItemSummary>) {
  const currentMetadataPath = safeResolve(getLlmWikiRoot(), item.metadataPath);
  const currentSourcePath = safeResolve(getLlmWikiRoot(), item.sourcePath);
  const nextSourcePath = safeResolve(getInboxDir(nextStatusDir), path.posix.basename(item.sourcePath));
  const nextMetadataPath = safeResolve(getInboxDir(nextStatusDir), path.posix.basename(item.metadataPath));

  ensureParentDir(nextSourcePath);
  ensureParentDir(nextMetadataPath);

  if (existsSync(currentSourcePath) && currentSourcePath !== nextSourcePath) {
    renameSync(currentSourcePath, nextSourcePath);
  }

  if (existsSync(currentMetadataPath) && currentMetadataPath !== nextMetadataPath) {
    renameSync(currentMetadataPath, nextMetadataPath);
  }

  const nextItem = {
    ...item,
    ...updates,
    metadataPath: getRelativeToWikiRoot(nextMetadataPath),
    sourcePath: getRelativeToWikiRoot(nextSourcePath),
  };

  writeInboxMetadata(nextItem);
  return nextItem;
}

function sourcePageFromInboxItem(item: InboxItemSummary, rawPath: string, sourceText: string) {
  return [
    `# Source: ${item.title}`,
    "",
    "## Source File",
    "",
    `- Inbox item: \`${item.id}\``,
    `- Raw file: \`raw/${rawPath}\``,
    `- Kind: ${item.kind}`,
    item.originalFilename ? `- Original filename: ${item.originalFilename}` : null,
    "",
    "## Extracted Content",
    "",
    sourceText || "Content extraction is pending.",
    "",
    "## Filing Hints",
    "",
    "- [[projects.md|Projects]]",
    "- [[problems.md|Problems]]",
    "- [[mentoring.md|Mentoring]]",
    "- [[open-loops.md|Open Loops]]",
    "- [[decisions.md|Decisions]]",
    "",
    "## LLM Processing",
    "",
    "- Status: manager handoff prepared",
    "- The next step is for the LLM Wiki manager to update related hub, topic and entity pages.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function processInboxItemWithConfiguredManager(item: InboxItemSummary) {
  const processingItem = moveInboxItem(item, "processing", {
    error: undefined,
    status: "processing",
  });
  const sourceAbsolutePath = safeResolve(getLlmWikiRoot(), processingItem.sourcePath);
  const rawRelativePath = uniquePath(getRawDir(), `inbox/${path.posix.basename(processingItem.sourcePath)}`);
  const rawAbsolutePath = safeResolve(getRawDir(), rawRelativePath);
  ensureParentDir(rawAbsolutePath);
  copyFileSync(sourceAbsolutePath, rawAbsolutePath);

  const sourceText = isTextLike(rawRelativePath)
    ? readTextFile(getRawDir(), rawRelativePath)
    : `${processingItem.kind === "voice" ? "Voice transcription" : "File text extraction"} pending for ${processingItem.originalFilename ?? processingItem.title}.`;
  const sourcePagePath = uniquePath(
    getWikiDir(),
    normalizeNewRelativePath(`sources/inbox-${processingItem.id}.md`, processingItem.title)
  );
  const sourcePageTarget = safeResolve(getWikiDir(), sourcePagePath);

  ensureParentDir(sourcePageTarget);
  writeFileAtomic(sourcePageTarget, `${sourcePageFromInboxItem(processingItem, rawRelativePath, sourceText)}\n`);
  appendLog("process", processingItem.title, [
    `Inbox item: \`${processingItem.id}\``,
    `Raw file: \`raw/${rawRelativePath}\``,
    `Source page: \`${sourcePagePath}\``,
    `Manager model: ${getWikiManagerConfig().model}`,
  ]);
  refreshGeneratedCatalog();
  moveInboxItem(processingItem, "processed", {
    processedAt: nowIso(),
    status: "processed",
  });
}

export function processPendingInboxItems() {
  ensureWikiInitialized();

  const managerConfig = getWikiManagerConfig();
  const pendingItems = listInboxItems().filter(
    (item) => item.metadataPath.startsWith("inbox/pending/") && (item.status === "pending" || item.status === "manual-review")
  );

  if (!pendingItems.length) {
    return { failed: 0, manualReview: 0, processed: 0, total: 0 };
  }

  if (!managerConfig.hasApiKey) {
    for (const item of pendingItems) {
      updateInboxItemInPlace(item, {
        error: "OPENAI_API_KEY is not configured. Manual review required before automatic wiki filing.",
        processedAt: nowIso(),
        status: "manual-review",
      });
    }

    return { failed: 0, manualReview: pendingItems.length, processed: 0, total: pendingItems.length };
  }

  let processed = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      processInboxItemWithConfiguredManager(item);
      processed += 1;
    } catch (error) {
      moveInboxItem(item, "failed", {
        error: error instanceof Error ? error.message : "Unknown processing error.",
        processedAt: nowIso(),
        status: "failed",
      });
      failed += 1;
    }
  }

  return { failed, manualReview: 0, processed, total: pendingItems.length };
}

export function getWikiSnapshot(input: { file?: string; kind?: string; q?: string }): WikiSnapshot {
  ensureWikiInitialized();

  const requestedKind: WikiEntryKind =
    input.kind === "raw" || input.kind === "schema" || input.kind === "wiki" ? input.kind : "wiki";
  const requestedPath = requestedKind === "schema" ? SCHEMA_FILENAME : input.file ?? DEFAULT_WIKI_FILE;
  const selected = findSelectedFile(requestedKind, requestedPath);
  const files = listWikiSummaries();
  const rawFiles = listRawSummaries();
  const schema = createSchemaSummary();
  const graph = buildWikiGraph(files);
  const allUpdated = [...files, ...rawFiles, schema].map((file) => file.updatedAt).sort().at(-1) ?? null;
  const query = String(input.q ?? "").trim();

  return {
    files,
    graph,
    query,
    rawFiles,
    schema,
    searchResults: searchEntries(query, [...files, ...rawFiles], schema),
    selected,
    stats: {
      lastUpdated: allUpdated,
      rawCount: rawFiles.length,
      wikiCount: files.length,
    },
  };
}

export function upsertWikiPage(input: { content: string; path: string; title: string }) {
  ensureWikiInitialized();

  const title = input.title.trim() || titleFromPath(input.path);
  const relativePath = normalizeNewRelativePath(input.path, title);
  const targetPath = safeResolve(getWikiDir(), relativePath);
  const existed = existsSync(targetPath);
  const content = input.content.trim()
    ? input.content.trimEnd()
    : [
        `# ${title}`,
        "",
        "## Summary",
        "",
        "Pending synthesis.",
        "",
        "## Links",
        "",
        "- [[index.md|Index]]",
      ].join("\n");

  ensureParentDir(targetPath);
  writeFileAtomic(targetPath, `${content}\n`);
  appendLog(existed ? "update" : "create", title, [`Wiki page: \`${relativePath}\``]);
  refreshGeneratedCatalog();

  return { path: relativePath, title };
}

export function updateExistingEntry(input: { content: string; kind: WikiEntryKind; path: string }) {
  ensureWikiInitialized();

  if (input.kind === "schema") {
    writeFileAtomic(getSchemaPath(), `${input.content.trimEnd()}\n`);
    appendLog("update", "Schema", [`File: \`${SCHEMA_FILENAME}\``]);
    return { kind: "schema" as const, path: SCHEMA_FILENAME };
  }

  if (input.kind !== "wiki") {
    throw new Error("Raw sources are immutable from the wiki editor.");
  }

  const relativePath = normalizeExistingRelativePath(input.path, DEFAULT_WIKI_FILE);
  const targetPath = safeResolve(getWikiDir(), relativePath);

  if (!existsSync(targetPath)) {
    throw new Error("Wiki page not found.");
  }

  writeFileAtomic(targetPath, `${input.content.trimEnd()}\n`);
  appendLog("update", extractTitle(input.content, relativePath), [`Wiki page: \`${relativePath}\``]);
  refreshGeneratedCatalog();

  return { kind: "wiki" as const, path: relativePath };
}

function uniquePath(baseDir: string, relativePath: string) {
  const extension = path.posix.extname(relativePath);
  const withoutExtension = extension ? relativePath.slice(0, -extension.length) : relativePath;
  let candidate = relativePath;
  let counter = 2;

  while (existsSync(safeResolve(baseDir, candidate))) {
    candidate = `${withoutExtension}-${counter}${extension}`;
    counter += 1;
  }

  return candidate;
}

function sourceStubContent(input: { rawPath: string; title: string }) {
  return [
    `# Source: ${input.title}`,
    "",
    "## Source File",
    "",
    `- Raw file: \`raw/${input.rawPath}\``,
    "- Ingest status: pending",
    "",
    "## Key Takeaways",
    "",
    "- Pending LLM ingest.",
    "",
    "## Links",
    "",
    "- [[index.md|Index]]",
  ].join("\n");
}

export async function addRawSource(input: {
  file?: File | null;
  sourcePath: string;
  text: string;
  title: string;
}) {
  ensureWikiInitialized();

  const title = input.title.trim() || "Untitled Source";
  const sourceText = input.text.trim();
  const uploadedFile = input.file;
  const defaultSourcePath = `${formatDateStamp()}-${title}`;
  let rawPath: string;

  if (uploadedFile && uploadedFile.size > 0) {
    rawPath = normalizeNewRelativePath(input.sourcePath || uploadedFile.name, uploadedFile.name, ".md");
    rawPath = uniquePath(getRawDir(), rawPath);
    const targetPath = safeResolve(getRawDir(), rawPath);
    ensureParentDir(targetPath);
    writeFileSync(targetPath, Buffer.from(await uploadedFile.arrayBuffer()));
  } else {
    if (!sourceText) {
      throw new Error("Add source text or upload a file.");
    }

    rawPath = normalizeNewRelativePath(input.sourcePath, defaultSourcePath);
    rawPath = uniquePath(getRawDir(), rawPath);
    const targetPath = safeResolve(getRawDir(), rawPath);
    ensureParentDir(targetPath);
    writeFileAtomic(
      targetPath,
      [
        "---",
        `title: "${title.replace(/"/g, '\\"')}"`,
        `added: "${nowIso()}"`,
        "type: source",
        "---",
        "",
        `# ${title}`,
        "",
        sourceText,
        "",
      ].join("\n")
    );
  }

  const sourcePagePath = uniquePath(
    getWikiDir(),
    normalizeNewRelativePath(`sources/${path.posix.basename(rawPath, path.posix.extname(rawPath))}.md`, title)
  );
  const sourcePageTarget = safeResolve(getWikiDir(), sourcePagePath);
  ensureParentDir(sourcePageTarget);
  writeFileAtomic(sourcePageTarget, `${sourceStubContent({ rawPath, title })}\n`);
  appendLog("ingest-queue", title, [`Raw source: \`raw/${rawPath}\``, `Source page: \`${sourcePagePath}\``]);
  refreshGeneratedCatalog();

  return { rawPath, sourcePagePath, title };
}

function normalizeWikiLinkTarget(currentPath: string, rawTarget: string) {
  void currentPath;
  const withoutAlias = rawTarget.split("|")[0]?.split("#")[0]?.trim() ?? "";
  if (!withoutAlias || /^https?:\/\//i.test(withoutAlias)) return null;

  const withExtension = path.posix.extname(withoutAlias) ? withoutAlias : `${withoutAlias}.md`;
  const normalized = path.posix.normalize(withExtension);

  return isUnsafePath(normalized) ? null : normalized;
}

function collectLinks(currentPath: string, contents: string) {
  const links = new Set<string>();
  const wikiLinkPattern = /\[\[([^\]]+)]]/g;
  const markdownLinkPattern = /\[[^\]]+]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = wikiLinkPattern.exec(contents))) {
    const target = normalizeWikiLinkTarget(currentPath, match[1]);
    if (target) links.add(target);
  }

  while ((match = markdownLinkPattern.exec(contents))) {
    const target = normalizeWikiLinkTarget(currentPath, match[1]);
    if (target) links.add(target);
  }

  return [...links];
}

function linkExists(target: string, paths: Set<string>) {
  return resolveExistingWikiPath(target, paths) !== null;
}

function resolveExistingWikiPath(target: string, paths: Set<string>) {
  if (paths.has(target)) return target;

  const targetBasename = path.posix.basename(target, path.posix.extname(target)).toLowerCase();
  return [...paths].find((filePath) => {
    const fileBasename = path.posix.basename(filePath, path.posix.extname(filePath)).toLowerCase();
    return fileBasename === targetBasename;
  }) ?? null;
}

function buildWikiGraph(files: WikiFileSummary[]) {
  const paths = new Set(files.map((file) => file.path));
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  const edgeKeys = new Set<string>();
  const edges: WikiGraphEdge[] = [];

  for (const file of files) {
    inbound.set(file.path, 0);
    outbound.set(file.path, 0);
  }

  for (const file of files) {
    const contents = readTextFile(getWikiDir(), file.path);
    const links = collectLinks(file.path, contents);

    for (const link of links) {
      const target = resolveExistingWikiPath(link, paths);

      if (!target || target === file.path) {
        continue;
      }

      const edgeKey = `${file.path}->${target}`;
      if (edgeKeys.has(edgeKey)) {
        continue;
      }

      edgeKeys.add(edgeKey);
      edges.push({ from: file.path, to: target });
      inbound.set(target, (inbound.get(target) ?? 0) + 1);
      outbound.set(file.path, (outbound.get(file.path) ?? 0) + 1);
    }
  }

  const nodes = files
    .map<WikiGraphNode>((file) => ({
      category: file.category,
      inbound: inbound.get(file.path) ?? 0,
      outbound: outbound.get(file.path) ?? 0,
      path: file.path,
      relevance: inbound.get(file.path) ?? 0,
      title: file.title,
    }))
    .sort((left, right) => {
      if (right.relevance !== left.relevance) return right.relevance - left.relevance;
      if (right.outbound !== left.outbound) return right.outbound - left.outbound;
      return left.title.localeCompare(right.title);
    });

  return {
    edges,
    maxInbound: Math.max(0, ...nodes.map((node) => node.inbound)),
    nodes,
  };
}

export function runWikiLint() {
  ensureWikiInitialized();

  const files = listWikiSummaries();
  const paths = new Set(files.map((file) => file.path));
  const inbound = new Map<string, number>();
  const missingLinks: { from: string; target: string }[] = [];

  for (const file of files) {
    inbound.set(file.path, 0);
  }

  for (const file of files) {
    const contents = readTextFile(getWikiDir(), file.path);
    const links = collectLinks(file.path, contents);

    for (const link of links) {
      if (linkExists(link, paths)) {
        const exactPath = paths.has(link)
          ? link
          : [...paths].find((filePath) => {
              const fileBasename = path.posix.basename(filePath, path.posix.extname(filePath)).toLowerCase();
              const linkBasename = path.posix.basename(link, path.posix.extname(link)).toLowerCase();
              return fileBasename === linkBasename;
            });

        if (exactPath) {
          inbound.set(exactPath, (inbound.get(exactPath) ?? 0) + 1);
        }
      } else {
        missingLinks.push({ from: file.path, target: link });
      }
    }
  }

  const ignoredOrphans = new Set([DEFAULT_WIKI_FILE, "log.md", "maintenance/wiki-health.md"]);
  const orphanPages = files
    .filter((file) => !ignoredOrphans.has(file.path) && (inbound.get(file.path) ?? 0) === 0)
    .map((file) => file.path);
  const indexContent = readTextFile(getWikiDir(), DEFAULT_WIKI_FILE);
  const missingFromIndex = files
    .filter((file) => !ignoredOrphans.has(file.path) && !indexContent.includes(file.path))
    .map((file) => file.path);
  const reportPath = "maintenance/wiki-health.md";
  const report = [
    "# Wiki Health",
    "",
    `Last run: ${nowIso()}`,
    "",
    "## Summary",
    "",
    `- Wiki pages: ${files.length}`,
    `- Raw sources: ${listRawSummaries().length}`,
    `- Missing links: ${missingLinks.length}`,
    `- Orphan pages: ${orphanPages.length}`,
    `- Pages missing from index: ${missingFromIndex.length}`,
    "",
    "## Missing Links",
    "",
    missingLinks.length
      ? missingLinks.map((link) => `- \`${link.from}\` -> \`${link.target}\``).join("\n")
      : "- None found.",
    "",
    "## Orphan Pages",
    "",
    orphanPages.length ? orphanPages.map((filePath) => `- \`${filePath}\``).join("\n") : "- None found.",
    "",
    "## Missing From Index",
    "",
    missingFromIndex.length
      ? missingFromIndex.map((filePath) => `- \`${filePath}\``).join("\n")
      : "- None found.",
  ].join("\n");

  const reportTarget = safeResolve(getWikiDir(), reportPath);
  ensureParentDir(reportTarget);
  writeFileAtomic(reportTarget, `${report}\n`);
  appendLog("lint", "Wiki health check", [`Report: \`${reportPath}\``]);
  refreshGeneratedCatalog();

  return { reportPath };
}
