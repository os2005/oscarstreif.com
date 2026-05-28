#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VALID_KINDS = new Set(["file", "text", "voice"]);
const VALID_STATUSES = new Set(["failed", "manual-review", "pending", "processed", "processing"]);
const SUMMARY_STATUSES = ["pending", "manual-review", "failed"];
const TEXT_EXTENSIONS = new Set([".csv", ".html", ".json", ".log", ".md", ".mdx", ".txt", ".xml", ".yaml", ".yml"]);
const CATALOG_START = "<!-- llm-wiki:catalog:start -->";
const CATALOG_END = "<!-- llm-wiki:catalog:end -->";

function parseArgs(argv) {
  const args = new Set(argv);
  const run = args.has("--run");

  return {
    dryRun: args.has("--dry-run") || !run,
    help: args.has("--help") || args.has("-h"),
    includeManualReview: args.has("--include-manual-review"),
    json: args.has("--json"),
    run,
    unknown: argv.filter(
      (arg) => !["--dry-run", "--json", "--run", "--include-manual-review", "--help", "-h"].includes(arg)
    ),
    usedDefaultDryRun: !argv.length,
  };
}

function usage() {
  return [
    "Usage: npm run llm-wiki:process -- --dry-run [--json]",
    "       npm run llm-wiki:process -- --run [--include-manual-review] [--json]",
    "",
    "Dry-run reads LLM Wiki inbox metadata without opening upload contents or changing runtime data.",
    "Run mode imports only text and text-like pending items. Voice transcription is not implemented yet.",
  ].join("\n");
}

function resolveRepoRoot() {
  const scriptPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptPath), "..");
}

function resolveAppDataDir(repoRoot) {
  const configured = process.env.APP_DATA_DIR;
  if (configured && path.isAbsolute(configured)) {
    return path.resolve(configured);
  }

  return path.resolve(repoRoot, configured || ".local-data");
}

function assertInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolvedCandidate;
  }

  throw new Error("Refusing to access a path outside the LLM Wiki root.");
}

function safeString(value) {
  return typeof value === "string" ? value : undefined;
}

function normalizeKind(value) {
  return VALID_KINDS.has(value) ? value : "file";
}

function normalizeStatus(value) {
  return VALID_STATUSES.has(value) ? value : "pending";
}

function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

function relativeToRoot(root, absolutePath) {
  return toPosixPath(path.relative(root, absolutePath));
}

function slugifyFilename(value, fallback = "untitled") {
  const cleaned = String(value || fallback)
    .normalize("NFKD")
    .replace(/[^\w .-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  return cleaned || fallback;
}

function isTextLike(item) {
  if (item.kind === "text") return true;

  const fromSource = path.posix.extname(toPosixPath(item.sourcePath || "")).toLowerCase();
  const fromOriginal = path.posix.extname(item.originalFilename || "").toLowerCase();
  return TEXT_EXTENSIONS.has(fromSource) || TEXT_EXTENSIONS.has(fromOriginal);
}

function readMetadataFile(wikiRoot, pendingDir, filename) {
  const metadataPath = assertInside(wikiRoot, path.join(pendingDir, filename));
  const raw = readFileSync(metadataPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Metadata is not a JSON object.");
  }

  const id = safeString(parsed.id);
  const title = safeString(parsed.title);
  const createdAt = safeString(parsed.createdAt);
  const sourcePath = safeString(parsed.sourcePath);

  if (!id) throw new Error("Missing id.");
  if (!title) throw new Error("Missing title.");
  if (!createdAt) throw new Error("Missing createdAt.");
  if (!sourcePath) throw new Error("Missing sourcePath.");

  const sourceAbsolutePath = assertInside(wikiRoot, path.join(wikiRoot, sourcePath));
  const size = existsSync(sourceAbsolutePath) ? statSync(sourceAbsolutePath).size : Number(parsed.size ?? 0) || 0;

  return {
    createdAt,
    id,
    kind: normalizeKind(parsed.kind),
    metadataFilename: filename,
    metadataPath: relativeToRoot(wikiRoot, metadataPath),
    mimeType: safeString(parsed.mimeType),
    originalFilename: safeString(parsed.originalFilename),
    size,
    sourceAbsolutePath,
    sourcePath: relativeToRoot(wikiRoot, sourceAbsolutePath),
    status: normalizeStatus(parsed.status),
    title,
  };
}

function countBy(items, key, values) {
  const counts = Object.fromEntries(values.map((value) => [value, 0]));

  for (const item of items) {
    if (Object.hasOwn(counts, item[key])) {
      counts[item[key]] += 1;
    }
  }

  return counts;
}

function createContext() {
  const repoRoot = resolveRepoRoot();
  const appDataDir = resolveAppDataDir(repoRoot);
  const wikiRoot = path.join(appDataDir, "llm-wiki");

  return {
    inboxPendingDir: assertInside(wikiRoot, path.join(wikiRoot, "inbox", "pending")),
    inboxProcessedDir: assertInside(wikiRoot, path.join(wikiRoot, "inbox", "processed")),
    rawInboxDir: assertInside(wikiRoot, path.join(wikiRoot, "raw", "inbox")),
    wikiDir: assertInside(wikiRoot, path.join(wikiRoot, "wiki")),
    wikiRoot,
    wikiSourcesDir: assertInside(wikiRoot, path.join(wikiRoot, "wiki", "sources")),
  };
}

function buildSummary(options) {
  const context = createContext();
  const result = {
    invalidItems: [],
    items: [],
    missing: [],
    mode: options.run ? "run" : "dry-run",
    pendingCount: 0,
    processed: [],
    root: context.wikiRoot,
    skipped: [],
    totalsByKind: { file: 0, text: 0, voice: 0 },
    totalsByStatus: { failed: 0, "manual-review": 0, pending: 0 },
  };

  if (!existsSync(context.wikiRoot)) {
    result.missing.push("llm-wiki root");
    return { context, summary: result };
  }

  if (!existsSync(context.inboxPendingDir)) {
    result.missing.push("inbox/pending");
    return { context, summary: result };
  }

  const metadataFiles = readdirSync(context.inboxPendingDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const filename of metadataFiles) {
    try {
      result.items.push(readMetadataFile(context.wikiRoot, context.inboxPendingDir, filename));
    } catch (error) {
      result.invalidItems.push({
        error: error instanceof Error ? error.message : "Unknown metadata error.",
        metadataFile: filename,
      });
    }
  }

  result.items.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  result.pendingCount = result.items.length;
  result.totalsByKind = countBy(result.items, "kind", ["file", "text", "voice"]);
  result.totalsByStatus = countBy(result.items, "status", SUMMARY_STATUSES);

  return { context, summary: result };
}

function shouldProcessItem(item, options) {
  if (item.status !== "pending" && !(options.includeManualReview && item.status === "manual-review")) {
    return { ok: false, reason: `status ${item.status} not selected` };
  }

  if (item.kind === "voice") {
    return { ok: false, reason: "voice transcription not implemented" };
  }

  if (item.kind === "file" && !isTextLike(item)) {
    return { ok: false, reason: "non-text file not implemented" };
  }

  if (!existsSync(item.sourceAbsolutePath)) {
    return { ok: false, reason: "source file missing" };
  }

  return { ok: true };
}

function ensureDir(directory) {
  mkdirSync(directory, { recursive: true });
}

function writeFileAtomic(filePath, contents) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  writeFileSync(tempPath, contents);
  renameSync(tempPath, filePath);
}

function readTextExtract(filePath) {
  const contents = readFileSync(filePath, "utf8");
  const normalized = contents.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  return normalized.length > 4000 ? `${normalized.slice(0, 4000)}\n\n[Extract truncated at 4000 characters.]` : normalized;
}

function sourcePagePathFor(context, item) {
  return assertInside(context.wikiRoot, path.join(context.wikiSourcesDir, `inbox-${slugifyFilename(item.id)}.md`));
}

function rawPathFor(context, item) {
  const basename = slugifyFilename(path.posix.basename(toPosixPath(item.sourcePath)), `${item.id}.md`);
  return assertInside(context.wikiRoot, path.join(context.rawInboxDir, basename));
}

function formatOptionalLine(label, value) {
  return value ? `- ${label}: ${value}` : `- ${label}:`;
}

function sourcePageContent(context, item, rawAbsolutePath) {
  const rawRelativePath = relativeToRoot(context.wikiRoot, rawAbsolutePath);
  const extract = readTextExtract(item.sourceAbsolutePath);

  return [
    `# Source: ${item.title}`,
    "",
    "## Source Metadata",
    "",
    `- Inbox ID: \`${item.id}\``,
    formatOptionalLine("Original filename", item.originalFilename ? `\`${item.originalFilename}\`` : ""),
    `- Kind: ${item.kind}`,
    formatOptionalLine("MIME type", item.mimeType ? `\`${item.mimeType}\`` : ""),
    `- Size: ${item.size} bytes`,
    `- Created at: ${item.createdAt}`,
    `- Raw path: \`${rawRelativePath}\``,
    "",
    "## Safe Extract",
    "",
    "```text",
    extract || "No text extract available.",
    "```",
    "",
    "## Processing Status",
    "",
    "- Local text import completed.",
    "- AI synthesis has not been run yet.",
    "- Audio transcription has not been run yet.",
    "",
    "## Filing Hints",
    "",
    "- [[projects.md|Projects]]",
    "- [[problems.md|Problems]]",
    "- [[mentoring.md|Mentoring]]",
    "- [[open-loops.md|Open Loops]]",
    "- [[decisions.md|Decisions]]",
    "",
  ].join("\n");
}

function titleFromPath(relativePath) {
  const basename = path.posix.basename(relativePath, path.posix.extname(relativePath));
  return basename
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function walkFiles(baseDir, relativeDir = "") {
  if (!existsSync(baseDir)) return [];

  const currentDir = relativeDir ? path.join(baseDir, relativeDir) : baseDir;
  return readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = relativeDir ? path.posix.join(toPosixPath(relativeDir), entry.name) : entry.name;
    if (entry.isDirectory()) return walkFiles(baseDir, entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
}

function refreshGeneratedCatalog(context) {
  const indexPath = assertInside(context.wikiRoot, path.join(context.wikiDir, "index.md"));
  const wikiPages = walkFiles(context.wikiDir)
    .filter((filePath) => filePath.endsWith(".md") && filePath !== "index.md" && filePath !== "log.md")
    .sort((left, right) => left.localeCompare(right));
  const rawSources = walkFiles(assertInside(context.wikiRoot, path.join(context.wikiRoot, "raw")))
    .sort((left, right) => left.localeCompare(right));
  const current = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "# LLM Wiki Index\n";
  const catalog = [
    CATALOG_START,
    "",
    "## Generated Catalog",
    "",
    "### Wiki Pages",
    "",
    wikiPages.length
      ? wikiPages.map((filePath) => `- [[${filePath}|${titleFromPath(filePath)}]]`).join("\n")
      : "- No wiki pages yet.",
    "",
    "### Raw Sources",
    "",
    rawSources.length
      ? rawSources.map((filePath) => `- \`raw/${filePath}\` - ${titleFromPath(filePath)}`).join("\n")
      : "- No raw sources yet.",
    "",
    CATALOG_END,
  ].join("\n");

  const next =
    current.includes(CATALOG_START) && current.includes(CATALOG_END)
      ? current.replace(new RegExp(`${CATALOG_START}[\\s\\S]*?${CATALOG_END}`), catalog)
      : `${current.trimEnd()}\n\n${catalog}\n`;

  writeFileAtomic(indexPath, next.endsWith("\n") ? next : `${next}\n`);
}

function appendLog(context, lines) {
  const logPath = assertInside(context.wikiRoot, path.join(context.wikiDir, "log.md"));
  const current = existsSync(logPath) ? readFileSync(logPath, "utf8").trimEnd() : "# Log";
  const entry = [``, `## [${new Date().toISOString().slice(0, 10)}] local-process | Text import`, ``, ...lines].join("\n");
  writeFileAtomic(logPath, `${current}${entry}\n`);
}

function moveProcessed(context, item, rawAbsolutePath, sourcePageAbsolutePath) {
  const currentMetadataPath = assertInside(context.wikiRoot, path.join(context.wikiRoot, item.metadataPath));
  const processedSourcePath = assertInside(context.wikiRoot, path.join(context.inboxProcessedDir, path.basename(item.sourcePath)));
  const processedMetadataPath = assertInside(context.wikiRoot, path.join(context.inboxProcessedDir, item.metadataFilename));

  ensureDir(context.inboxProcessedDir);

  const nextItem = {
    createdAt: item.createdAt,
    id: item.id,
    kind: item.kind,
    metadataPath: relativeToRoot(context.wikiRoot, processedMetadataPath),
    mimeType: item.mimeType,
    originalFilename: item.originalFilename,
    processedAt: new Date().toISOString(),
    size: item.size,
    sourcePath: relativeToRoot(context.wikiRoot, processedSourcePath),
    status: "processed",
    title: item.title,
    rawPath: relativeToRoot(context.wikiRoot, rawAbsolutePath),
    sourcePagePath: relativeToRoot(context.wikiDir, sourcePageAbsolutePath),
  };

  if (existsSync(item.sourceAbsolutePath)) {
    renameSync(item.sourceAbsolutePath, processedSourcePath);
  }

  if (existsSync(currentMetadataPath)) {
    writeFileAtomic(currentMetadataPath, `${JSON.stringify(nextItem, null, 2)}\n`);
    if (currentMetadataPath !== processedMetadataPath) {
      renameSync(currentMetadataPath, processedMetadataPath);
    }
  }
}

function processItem(context, item) {
  const rawAbsolutePath = rawPathFor(context, item);
  const sourcePageAbsolutePath = sourcePagePathFor(context, item);

  ensureDir(context.rawInboxDir);
  ensureDir(context.wikiSourcesDir);
  copyFileSync(item.sourceAbsolutePath, rawAbsolutePath);
  writeFileAtomic(sourcePageAbsolutePath, sourcePageContent(context, item, rawAbsolutePath));
  moveProcessed(context, item, rawAbsolutePath, sourcePageAbsolutePath);

  return {
    id: item.id,
    kind: item.kind,
    rawPath: relativeToRoot(context.wikiRoot, rawAbsolutePath),
    sourcePagePath: relativeToRoot(context.wikiDir, sourcePageAbsolutePath),
    status: "processed",
    title: item.title,
  };
}

function runImport(context, summary, options) {
  const processed = [];
  const skipped = [];
  const failed = [];

  for (const item of summary.items) {
    const decision = shouldProcessItem(item, options);
    if (!decision.ok) {
      skipped.push({ id: item.id, kind: item.kind, reason: decision.reason, status: item.status, title: item.title });
      continue;
    }

    try {
      processed.push(processItem(context, item));
    } catch (error) {
      failed.push({
        error: error instanceof Error ? error.message : "Unknown processing error.",
        id: item.id,
        kind: item.kind,
        status: item.status,
        title: item.title,
      });
    }
  }

  if (processed.length) {
    refreshGeneratedCatalog(context);
    appendLog(context, [
      `- Processed items: ${processed.length}`,
      `- Skipped items: ${skipped.length}`,
      `- Failed items: ${failed.length}`,
      ...processed.map((item) => `- Imported \`${item.id}\` -> \`${item.sourcePagePath}\``),
    ]);
  }

  summary.processed = processed;
  summary.skipped = skipped;
  summary.failed = failed;
}

function printableItem(item) {
  return {
    createdAt: item.createdAt,
    id: item.id,
    kind: item.kind,
    mimeType: item.mimeType,
    originalFilename: item.originalFilename,
    size: item.size,
    status: item.status,
    title: item.title,
  };
}

function printSummary(summary, options) {
  console.log(options.run ? "LLM Wiki local text import" : "LLM Wiki local processing dry-run");
  console.log(`Root: ${summary.root}`);
  console.log(options.run ? "Mode: run" : options.usedDefaultDryRun ? "Mode: dry-run (default)" : "Mode: dry-run");

  if (summary.missing.length) {
    console.log(`Missing: ${summary.missing.join(", ")}`);
    console.log("No runtime data was changed.");
    return;
  }

  console.log(`Pending metadata items: ${summary.pendingCount}`);
  console.log(
    `By kind: text=${summary.totalsByKind.text}, file=${summary.totalsByKind.file}, voice=${summary.totalsByKind.voice}`
  );
  console.log(
    `By status: pending=${summary.totalsByStatus.pending}, manual-review=${summary.totalsByStatus["manual-review"]}, failed=${summary.totalsByStatus.failed}`
  );
  console.log(`Invalid metadata items: ${summary.invalidItems.length}`);

  if (options.run) {
    console.log(`Processed: ${summary.processed.length}`);
    console.log(`Skipped: ${summary.skipped.length}`);
    console.log(`Failed: ${summary.failed?.length ?? 0}`);
  }

  if (!options.run && summary.items.length) {
    console.log("");
    console.log("Items:");
    for (const item of summary.items) {
      const safeItem = printableItem(item);
      const details = [
        `id=${safeItem.id}`,
        `title=${JSON.stringify(safeItem.title)}`,
        `kind=${safeItem.kind}`,
        `status=${safeItem.status}`,
        `createdAt=${safeItem.createdAt}`,
        safeItem.originalFilename ? `originalFilename=${JSON.stringify(safeItem.originalFilename)}` : null,
        `size=${safeItem.size}`,
        safeItem.mimeType ? `mimeType=${JSON.stringify(safeItem.mimeType)}` : null,
      ].filter(Boolean);
      console.log(`- ${details.join(" | ")}`);
    }
  }

  if (summary.skipped.length) {
    console.log("");
    console.log("Skipped:");
    for (const item of summary.skipped) {
      console.log(`- id=${item.id} | kind=${item.kind} | status=${item.status} | reason=${item.reason}`);
    }
  }

  if (summary.failed?.length) {
    console.log("");
    console.log("Failed:");
    for (const item of summary.failed) {
      console.log(`- id=${item.id} | kind=${item.kind} | status=${item.status} | error=${item.error}`);
    }
  }

  if (summary.invalidItems.length) {
    console.log("");
    console.log("Invalid metadata:");
    for (const item of summary.invalidItems) {
      console.log(`- metadataFile=${item.metadataFile} | error=${item.error}`);
    }
  }

  console.log("");
  console.log(options.run ? "Run completed. Runtime data may have changed." : "No runtime data was changed.");
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return 0;
  }

  if (options.unknown.length) {
    console.error(`Unknown option(s): ${options.unknown.join(", ")}`);
    console.error(usage());
    return 2;
  }

  if (options.run && options.dryRun && process.argv.includes("--dry-run")) {
    console.error("Use either --run or --dry-run, not both.");
    return 2;
  }

  try {
    const { context, summary } = buildSummary(options);

    if (options.run && !summary.missing.length) {
      runImport(context, summary, options);
    }

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ...summary,
            dryRun: !options.run,
            items: summary.items.map(printableItem),
          },
          null,
          2
        )
      );
    } else {
      printSummary(summary, options);
    }

    return summary.failed?.length ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown processing error.");
    return 1;
  }
}

process.exitCode = main();
