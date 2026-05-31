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
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VPS_ROOT = "/var/lib/oscarstreif/llm-wiki";
const TEXT_EXTENSIONS = new Set([".csv", ".html", ".json", ".log", ".md", ".mdx", ".txt", ".xml", ".yaml", ".yml"]);
const CATALOG_START = "<!-- llm-wiki:catalog:start -->";
const CATALOG_END = "<!-- llm-wiki:catalog:end -->";
const FORBIDDEN_SEGMENTS = new Set([".env", "auth-store.json", "sessions", "session", "secrets", "credentials"]);
const WIKI_STRUCTURE_FILES = [
  ["action-tracker.md", "Action Tracker", "Tracked actions extracted during Codex organization passes. Keep entries concise and link each item back to one or more source pages."],
  ["decision-log.md", "Decision Log", "Durable decisions extracted during Codex organization passes. Preserve uncertainty and link each decision back to one or more source pages."],
  ["open-loops.md", "Open Loops", "Open questions, unresolved follow-ups and pending review items. Mark uncertainty clearly and link each item back to one or more source pages."],
  ["main/index.md", "Main Workspace", "Use these curated documents as the primary LLM-Wiki working surface.", [
    "- [[main/current-projects.md|Current Projects]]",
    "- [[main/problems.md|Problems]]",
    "- [[main/mentoring-onepager.md|Mentoring Onepager]]",
    "- [[main/mentoring-knowledge-base.md|Mentoring Knowledge Base]]",
    "- [[main/todos.md|Todos]]",
  ]],
  ["main/current-projects.md", "Current Projects", "Maintain active projects, goals, status, next steps and relevant context. Every durable claim must link back to one or more source pages."],
  ["main/problems.md", "Problems", "Maintain recurring problems, frictions, constraints and unresolved technical or personal issues. Every durable claim must link back to one or more source pages."],
  ["main/mentoring-onepager.md", "Mentoring Onepager", "Maintain a concise mentoring preparation page with current priorities, questions and talking points. Link each item back to one or more source pages."],
  ["main/mentoring-knowledge-base.md", "Mentoring Knowledge Base", "Maintain durable mentoring insights, patterns and learnings. Link each insight back to one or more source pages."],
  ["main/todos.md", "Todos", "Maintain actionable tasks extracted from new inputs. Keep items concise, preserve uncertainty and link each item back to one or more source pages."],
  ["system/taxonomy.md", "Taxonomy", "Define the small set of maintained main documents and the rules for filing durable knowledge into them."],
  ["system/source-map.md", "Source Map", "Map each processed source page to the curated main documents and trackers it informed. Do not copy raw source content into this map."],
  ["system/ingest-rules.md", "Ingest Rules", "During each Codex organization pass: review new source pages, update only relevant curated main documents, add source backlinks for every durable claim, update trackers when applicable, refresh the source map, and append a concise log entry."],
];

function parseArgs(argv) {
  const options = {
    dryRun: true,
    extractPdf: false,
    help: false,
    includeManualReview: false,
    json: false,
    noArchive: false,
    root: null,
    run: false,
    unknown: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--run") {
      options.run = true;
      options.dryRun = false;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--include-manual-review") {
      options.includeManualReview = true;
    } else if (arg === "--extract-pdf") {
      options.extractPdf = true;
    } else if (arg === "--no-archive") {
      options.noArchive = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        options.unknown.push("--root requires a path");
      } else {
        options.root = value;
        index += 1;
      }
    } else {
      options.unknown.push(arg);
    }
  }

  return options;
}

function usage() {
  return [
    "Usage: npm run llm-wiki:ingest-direct -- --dry-run [--root <path>] [--include-manual-review] [--extract-pdf] [--json]",
    "       npm run llm-wiki:ingest-direct -- --run [--root <path>] [--include-manual-review] [--extract-pdf] [--no-archive] [--json]",
    "",
    "Directly imports pending items inside one private LLM Wiki root.",
    "Without --run, the command is a read-only dry-run.",
  ].join("\n");
}

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function resolveWikiRoot(options) {
  if (options.root) return path.resolve(options.root);
  if (process.env.APP_DATA_DIR) return path.resolve(process.env.APP_DATA_DIR, "llm-wiki");
  if (existsSync(VPS_ROOT)) return path.resolve(VPS_ROOT);
  return path.resolve(repoRoot(), ".local-data", "llm-wiki");
}

function isInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertInside(root, candidate) {
  if (!isInside(root, candidate)) {
    throw new Error("Refusing to access a path outside the LLM Wiki root.");
  }

  return path.resolve(candidate);
}

function toPosix(value) {
  return String(value).replace(/\\/g, "/");
}

function relativeTo(root, candidate) {
  return toPosix(path.relative(root, candidate));
}

function hasForbiddenSegment(candidate) {
  return toPosix(candidate)
    .toLowerCase()
    .split("/")
    .some((segment) => FORBIDDEN_SEGMENTS.has(segment) || segment.startsWith(".env") || segment.includes("secret"));
}

function assertAllowedPath(root, candidate) {
  const resolved = assertInside(root, candidate);
  if (hasForbiddenSegment(relativeTo(root, resolved))) {
    throw new Error("Refusing to access a protected path.");
  }

  return resolved;
}

function ensureDir(directory) {
  mkdirSync(directory, { recursive: true });
}

function writeAtomic(filePath, contents) {
  ensureDir(path.dirname(filePath));
  const temporaryPath = `${filePath}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  writeFileSync(temporaryPath, contents);
  renameSync(temporaryPath, filePath);
}

function slugify(value, fallback = "untitled") {
  const result = String(value || fallback)
    .normalize("NFKD")
    .replace(/[^\w .-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  return result || fallback;
}

function commandAvailable(command) {
  const checker = process.platform === "win32" ? "where.exe" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(checker, args, { encoding: "utf8", shell: process.platform !== "win32", windowsHide: true });
  return !result.error && result.status === 0;
}

function createContext(options) {
  const wikiRoot = resolveWikiRoot(options);
  return {
    inboxPendingDir: assertAllowedPath(wikiRoot, path.join(wikiRoot, "inbox", "pending")),
    inboxProcessedDir: assertAllowedPath(wikiRoot, path.join(wikiRoot, "inbox", "processed")),
    rawExtractedDir: assertAllowedPath(wikiRoot, path.join(wikiRoot, "raw", "extracted")),
    rawInboxDir: assertAllowedPath(wikiRoot, path.join(wikiRoot, "raw", "inbox")),
    wikiDir: assertAllowedPath(wikiRoot, path.join(wikiRoot, "wiki")),
    wikiRoot,
    wikiSourcesDir: assertAllowedPath(wikiRoot, path.join(wikiRoot, "wiki", "sources")),
  };
}

function readMetadata(context, metadataFilename) {
  const metadataPath = assertAllowedPath(context.wikiRoot, path.join(context.inboxPendingDir, metadataFilename));
  const parsed = JSON.parse(readFileSync(metadataPath, "utf8"));

  if (!parsed || typeof parsed !== "object") throw new Error("Metadata is not an object.");
  if (typeof parsed.id !== "string" || !parsed.id) throw new Error("Metadata is missing an id.");
  if (typeof parsed.sourcePath !== "string" || !parsed.sourcePath) throw new Error("Metadata is missing a source path.");

  const sourceAbsolutePath = assertAllowedPath(context.wikiRoot, path.join(context.wikiRoot, parsed.sourcePath));
  return {
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : null,
    id: parsed.id,
    kind: typeof parsed.kind === "string" ? parsed.kind : "file",
    metadataFilename,
    metadataPath,
    mimeType: typeof parsed.mimeType === "string" ? parsed.mimeType : undefined,
    originalFilename: typeof parsed.originalFilename === "string" ? parsed.originalFilename : undefined,
    size: existsSync(sourceAbsolutePath) ? statSync(sourceAbsolutePath).size : Number(parsed.size) || 0,
    sourceAbsolutePath,
    sourcePath: relativeTo(context.wikiRoot, sourceAbsolutePath),
    status: typeof parsed.status === "string" ? parsed.status : "pending",
    title: typeof parsed.title === "string" && parsed.title ? parsed.title : "Untitled source",
  };
}

function listPendingItems(context) {
  if (!existsSync(context.wikiRoot) || !existsSync(context.inboxPendingDir)) return { invalid: 0, items: [], missing: true };

  const metadataFiles = readdirSync(context.inboxPendingDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const items = [];
  let invalid = 0;

  for (const metadataFilename of metadataFiles) {
    try {
      items.push(readMetadata(context, metadataFilename));
    } catch {
      invalid += 1;
    }
  }

  return { invalid, items, missing: false };
}

function extensionFor(item) {
  return path.posix.extname(toPosix(item.originalFilename || item.sourcePath)).toLowerCase();
}

function chooseAction(item, options, pdfExtractorAvailable) {
  if (item.status !== "pending" && !(options.includeManualReview && item.status === "manual-review")) {
    return { ok: false, reason: "status not selected" };
  }

  if (!existsSync(item.sourceAbsolutePath)) return { ok: false, reason: "source file missing" };
  if (item.kind === "voice") return { ok: false, reason: "voice skipped: transcription not configured" };

  const extension = extensionFor(item);
  if (extension === ".pdf") {
    if (!options.extractPdf) return { ok: false, reason: "pdf skipped: extraction not enabled" };
    if (!pdfExtractorAvailable) return { ok: false, reason: "pdf skipped: extractor not configured" };
    return { ok: true, type: "pdf" };
  }

  if (item.kind === "text" || TEXT_EXTENSIONS.has(extension)) return { ok: true, type: "text" };
  return { ok: false, reason: "file skipped: unsupported format" };
}

function extractText(item, type) {
  if (type === "pdf") {
    const result = spawnSync("pdftotext", [item.sourceAbsolutePath, "-"], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
      windowsHide: true,
    });

    if (result.error || result.status !== 0) throw new Error("PDF extraction failed.");
    return result.stdout.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  }

  return readFileSync(item.sourceAbsolutePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function truncateExtract(contents) {
  return contents.length > 12000 ? `${contents.slice(0, 12000)}\n\n[Extract truncated at 12000 characters.]` : contents;
}

function sourcePagePath(context, item) {
  return assertAllowedPath(context.wikiRoot, path.join(context.wikiSourcesDir, `inbox-${slugify(item.id)}.md`));
}

function rawPath(context, item, type) {
  if (type === "pdf") return assertAllowedPath(context.wikiRoot, path.join(context.rawExtractedDir, `${slugify(item.id)}.txt`));
  const basename = slugify(path.posix.basename(toPosix(item.sourcePath)), `${slugify(item.id)}.txt`);
  return assertAllowedPath(context.wikiRoot, path.join(context.rawInboxDir, basename));
}

function sourcePageContent(context, item, rawAbsolutePath, extract, type) {
  return [
    `# Source: ${item.title}`,
    "",
    "## Source Metadata",
    "",
    `- Inbox ID: \`${item.id}\``,
    `- Kind: ${item.kind}`,
    `- Import type: ${type}`,
    `- Raw path: \`${relativeTo(context.wikiRoot, rawAbsolutePath)}\``,
    "",
    "## Safe Extract",
    "",
    "```text",
    truncateExtract(extract) || "No text extract available.",
    "```",
    "",
    "## Processing Status",
    "",
    "- Direct private import completed.",
    "- Codex synthesis has not been run yet.",
    "",
    "## Filing Hints",
    "",
    "- [[action-tracker.md|Action Tracker]]",
    "- [[decision-log.md|Decision Log]]",
    "- [[open-loops.md|Open Loops]]",
    "- [[main/index.md|Main Workspace]]",
    "- [[system/source-map.md|Source Map]]",
    "",
  ].join("\n");
}

function walkFiles(baseDir, relativeDir = "") {
  if (!existsSync(baseDir)) return [];
  const currentDir = relativeDir ? path.join(baseDir, relativeDir) : baseDir;
  return readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const child = relativeDir ? path.posix.join(toPosix(relativeDir), entry.name) : entry.name;
    return entry.isDirectory() ? walkFiles(baseDir, child) : entry.isFile() ? [child] : [];
  });
}

function titleFromPath(relativePath) {
  return path.posix
    .basename(relativePath, path.posix.extname(relativePath))
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function refreshCatalog(context) {
  const indexPath = assertAllowedPath(context.wikiRoot, path.join(context.wikiDir, "index.md"));
  const wikiPages = walkFiles(context.wikiDir)
    .filter((file) => file.endsWith(".md") && file !== "index.md" && file !== "log.md")
    .sort((left, right) => left.localeCompare(right));
  const rawSources = walkFiles(path.join(context.wikiRoot, "raw")).sort((left, right) => left.localeCompare(right));
  const current = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "# LLM Wiki Index\n";
  const catalog = [
    CATALOG_START,
    "",
    "## Generated Catalog",
    "",
    "### Wiki Pages",
    "",
    wikiPages.length ? wikiPages.map((file) => `- [[${file}|${titleFromPath(file)}]]`).join("\n") : "- No wiki pages yet.",
    "",
    "### Raw Sources",
    "",
    rawSources.length ? rawSources.map((file) => `- \`raw/${file}\` - ${titleFromPath(file)}`).join("\n") : "- No raw sources yet.",
    "",
    CATALOG_END,
  ].join("\n");
  const next =
    current.includes(CATALOG_START) && current.includes(CATALOG_END)
      ? current.replace(new RegExp(`${CATALOG_START}[\\s\\S]*?${CATALOG_END}`), catalog)
      : `${current.trimEnd()}\n\n${catalog}\n`;

  writeAtomic(indexPath, next.endsWith("\n") ? next : `${next}\n`);
}

function appendLog(context, processed, skipped, failed) {
  const logPath = assertAllowedPath(context.wikiRoot, path.join(context.wikiDir, "log.md"));
  const current = existsSync(logPath) ? readFileSync(logPath, "utf8").trimEnd() : "# Log";
  const entry = [
    "",
    `## [${new Date().toISOString().slice(0, 10)}] direct-ingest | Private source import`,
    "",
    `- Processed items: ${processed}`,
    `- Skipped items: ${skipped}`,
    `- Failed items: ${failed}`,
  ].join("\n");
  writeAtomic(logPath, `${current}${entry}\n`);
}

function ensureWikiStructure(context) {
  ensureDir(context.wikiDir);
  ensureDir(context.wikiSourcesDir);
  let created = 0;
  for (const [filename, title, body, links = []] of WIKI_STRUCTURE_FILES) {
    const target = assertAllowedPath(context.wikiRoot, path.join(context.wikiDir, filename));
    if (!existsSync(target)) {
      writeAtomic(
        target,
        [`# ${title}`, "", body, "", "## Items", "", links.length ? links.join("\n") : "- None recorded yet.", ""].join("\n")
      );
      created += 1;
    }
  }
  return created;
}

function archiveItem(context, item, rawAbsolutePath, sourcePageAbsolutePath, options) {
  const processedAt = new Date().toISOString();
  const metadata = {
    createdAt: item.createdAt,
    id: item.id,
    kind: item.kind,
    metadataPath: options.noArchive
      ? relativeTo(context.wikiRoot, item.metadataPath)
      : relativeTo(context.wikiRoot, path.join(context.inboxProcessedDir, item.metadataFilename)),
    mimeType: item.mimeType,
    originalFilename: item.originalFilename,
    processedAt,
    rawPath: relativeTo(context.wikiRoot, rawAbsolutePath),
    size: item.size,
    sourcePagePath: relativeTo(context.wikiDir, sourcePageAbsolutePath),
    sourcePath: options.noArchive
      ? item.sourcePath
      : relativeTo(context.wikiRoot, path.join(context.inboxProcessedDir, path.basename(item.sourcePath))),
    status: "processed",
    title: item.title,
  };

  if (options.noArchive) {
    writeAtomic(item.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    return;
  }

  ensureDir(context.inboxProcessedDir);
  const processedSourcePath = assertAllowedPath(context.wikiRoot, path.join(context.inboxProcessedDir, path.basename(item.sourcePath)));
  const processedMetadataPath = assertAllowedPath(context.wikiRoot, path.join(context.inboxProcessedDir, item.metadataFilename));
  if (existsSync(processedSourcePath) || existsSync(processedMetadataPath)) {
    throw new Error("Processed archive target already exists.");
  }

  renameSync(item.sourceAbsolutePath, processedSourcePath);
  writeAtomic(item.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  renameSync(item.metadataPath, processedMetadataPath);
}

function processItem(context, item, type, options) {
  const extract = extractText(item, type);
  const rawAbsolutePath = rawPath(context, item, type);
  const sourcePageAbsolutePath = sourcePagePath(context, item);
  if (existsSync(rawAbsolutePath) || existsSync(sourcePageAbsolutePath)) {
    throw new Error("Import target already exists.");
  }
  ensureDir(path.dirname(rawAbsolutePath));
  if (type === "pdf") writeAtomic(rawAbsolutePath, `${extract}\n`);
  else copyFileSync(item.sourceAbsolutePath, rawAbsolutePath);
  writeAtomic(sourcePageAbsolutePath, sourcePageContent(context, item, rawAbsolutePath, extract, type));
  archiveItem(context, item, rawAbsolutePath, sourcePageAbsolutePath, options);
}

function summarize(options) {
  const context = createContext(options);
  const listed = listPendingItems(context);
  const pdfExtractorAvailable = commandAvailable("pdftotext");
  const summary = {
    wikiStructureFilesCreated: 0,
    dryRun: !options.run,
    failed: 0,
    invalidMetadata: listed.invalid,
    missingRootOrPending: listed.missing,
    pdfExtractorAvailable,
    pendingMetadata: listed.items.length,
    processed: 0,
    skipped: 0,
    skippedByReason: {},
  };

  if (!options.run || listed.missing) return { context, listed, pdfExtractorAvailable, summary };
  summary.wikiStructureFilesCreated = ensureWikiStructure(context);

  for (const item of listed.items) {
    const action = chooseAction(item, options, pdfExtractorAvailable);
    if (!action.ok) {
      summary.skipped += 1;
      summary.skippedByReason[action.reason] = (summary.skippedByReason[action.reason] || 0) + 1;
      continue;
    }

    try {
      processItem(context, item, action.type, options);
      summary.processed += 1;
    } catch {
      summary.failed += 1;
    }
  }

  if (summary.processed || summary.wikiStructureFilesCreated) refreshCatalog(context);
  if (summary.processed) appendLog(context, summary.processed, summary.skipped, summary.failed);
  return { context, listed, pdfExtractorAvailable, summary };
}

function printSummary(summary, options) {
  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log("LLM Wiki direct private ingest");
  console.log(`Mode: ${summary.dryRun ? "dry-run" : "run"}`);
  console.log(`Pending metadata items: ${summary.pendingMetadata}`);
  console.log(`Invalid metadata items: ${summary.invalidMetadata}`);
  console.log(`Processed: ${summary.processed}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`PDF extractor available: ${summary.pdfExtractorAvailable}`);
  if (summary.missingRootOrPending) console.log("Missing: LLM Wiki root or inbox/pending");
  if (Object.keys(summary.skippedByReason).length) {
    console.log("Skipped by reason:");
    for (const [reason, count] of Object.entries(summary.skippedByReason)) console.log(`- ${reason}: ${count}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return 0;
  }
  if (options.unknown.length) {
    console.error(`Invalid option(s): ${options.unknown.join(", ")}`);
    console.error(usage());
    return 2;
  }
  if (options.run && process.argv.includes("--dry-run")) {
    console.error("Use either --run or --dry-run, not both.");
    return 2;
  }

  try {
    const { summary } = summarize(options);
    printSummary(summary, options);
    return summary.failed || summary.invalidMetadata ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Direct ingest failed.");
    return 1;
  }
}

process.exitCode = main();
