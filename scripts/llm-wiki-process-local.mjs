#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VALID_KINDS = new Set(["file", "text", "voice"]);
const VALID_STATUSES = new Set(["failed", "manual-review", "pending", "processed", "processing"]);
const SUMMARY_STATUSES = ["pending", "manual-review", "failed"];

function parseArgs(argv) {
  const args = new Set(argv);

  return {
    dryRun: args.has("--dry-run") || !argv.length,
    help: args.has("--help") || args.has("-h"),
    json: args.has("--json"),
    unknown: argv.filter((arg) => !["--dry-run", "--json", "--help", "-h"].includes(arg)),
    usedDefaultDryRun: !argv.length,
  };
}

function usage() {
  return [
    "Usage: npm run llm-wiki:process -- --dry-run [--json]",
    "",
    "Reads LLM Wiki inbox metadata without opening upload contents or changing runtime data.",
    "Default with no flags is a read-only dry-run.",
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

  throw new Error(`Refusing to read outside LLM Wiki root: ${candidate}`);
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
    mimeType: safeString(parsed.mimeType),
    originalFilename: safeString(parsed.originalFilename),
    size,
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

function buildSummary() {
  const repoRoot = resolveRepoRoot();
  const appDataDir = resolveAppDataDir(repoRoot);
  const wikiRoot = path.join(appDataDir, "llm-wiki");
  const pendingDir = assertInside(wikiRoot, path.join(wikiRoot, "inbox", "pending"));
  const result = {
    invalidItems: [],
    items: [],
    missing: [],
    pendingCount: 0,
    root: wikiRoot,
    totalsByKind: { file: 0, text: 0, voice: 0 },
    totalsByStatus: { failed: 0, "manual-review": 0, pending: 0 },
  };

  if (!existsSync(wikiRoot)) {
    result.missing.push("llm-wiki root");
    return result;
  }

  if (!existsSync(pendingDir)) {
    result.missing.push("inbox/pending");
    return result;
  }

  const metadataFiles = readdirSync(pendingDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const filename of metadataFiles) {
    try {
      result.items.push(readMetadataFile(wikiRoot, pendingDir, filename));
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

  return result;
}

function printTextSummary(summary, options) {
  console.log("LLM Wiki local processing dry-run");
  console.log(`Root: ${summary.root}`);

  if (options.usedDefaultDryRun) {
    console.log("Mode: dry-run (default)");
  } else {
    console.log("Mode: dry-run");
  }

  if (summary.missing.length) {
    console.log(`Missing: ${summary.missing.join(", ")}`);
    console.log("No runtime data was changed.");
    return;
  }

  console.log(`Pending items: ${summary.pendingCount}`);
  console.log(
    `By kind: text=${summary.totalsByKind.text}, file=${summary.totalsByKind.file}, voice=${summary.totalsByKind.voice}`
  );
  console.log(
    `By status: pending=${summary.totalsByStatus.pending}, manual-review=${summary.totalsByStatus["manual-review"]}, failed=${summary.totalsByStatus.failed}`
  );
  console.log(`Invalid metadata items: ${summary.invalidItems.length}`);

  if (summary.items.length) {
    console.log("");
    console.log("Items:");
    for (const item of summary.items) {
      const details = [
        `id=${item.id}`,
        `title=${JSON.stringify(item.title)}`,
        `kind=${item.kind}`,
        `status=${item.status}`,
        `createdAt=${item.createdAt}`,
        item.originalFilename ? `originalFilename=${JSON.stringify(item.originalFilename)}` : null,
        `size=${item.size}`,
        item.mimeType ? `mimeType=${JSON.stringify(item.mimeType)}` : null,
      ].filter(Boolean);
      console.log(`- ${details.join(" | ")}`);
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
  console.log("No runtime data was changed.");
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

  if (!options.dryRun) {
    console.error("Only --dry-run is supported right now.");
    return 2;
  }

  try {
    const summary = buildSummary();

    if (options.json) {
      console.log(JSON.stringify({ dryRun: true, ...summary }, null, 2));
    } else {
      printTextSummary(summary, options);
    }

    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown dry-run error.");
    return 1;
  }
}

process.exitCode = main();
