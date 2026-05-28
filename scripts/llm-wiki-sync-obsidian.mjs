#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_TARGET_SEGMENTS = ["Documents", "Obsidian", "LLM-Wiki-Mirror"];
const MIRROR_README = [
  "# LLM Wiki Mirror",
  "",
  "This vault is an automatically generated one-way mirror.",
  "",
  "Primary truth: `.local-data/llm-wiki/wiki`.",
  "",
  "Manual changes in this mirror may be overwritten by the next sync.",
  "",
  "Do not treat this Obsidian folder as the backend or canonical editing surface.",
  "",
].join("\n");

function parseArgs(argv) {
  const options = {
    dryRun: true,
    help: false,
    json: false,
    run: false,
    target: null,
    unknown: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--run") {
      options.run = true;
      options.dryRun = false;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--target") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        options.unknown.push("--target requires a path");
      } else {
        options.target = value;
        index += 1;
      }
      continue;
    }

    options.unknown.push(arg);
  }

  return options;
}

function usage() {
  return [
    "Usage: npm run llm-wiki:sync-obsidian -- --dry-run [--target <path>] [--json]",
    "       npm run llm-wiki:sync-obsidian -- --run [--target <path>] [--json]",
    "",
    "Mirrors .local-data/llm-wiki/wiki to a local Obsidian folder.",
    "No files are deleted from the target in this version.",
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

function defaultTargetPath() {
  return path.join(os.homedir(), ...DEFAULT_TARGET_SEGMENTS);
}

function isSameOrInside(parent, candidate) {
  const resolvedParent = path.resolve(parent);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedParent, resolvedCandidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertInside(parent, candidate, label) {
  if (!isSameOrInside(parent, candidate)) {
    throw new Error(`${label} is outside the allowed root.`);
  }

  return path.resolve(candidate);
}

function isDangerousRoot(targetPath, repoRoot) {
  const resolved = path.resolve(targetPath);
  const parsed = path.parse(resolved);
  const home = path.resolve(os.homedir());
  const repo = path.resolve(repoRoot);

  return (
    resolved === parsed.root ||
    resolved === home ||
    resolved === repo ||
    resolved === path.parse(home).root ||
    resolved.length <= parsed.root.length + 1
  );
}

function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

function walkFiles(baseDir, relativeDir = "") {
  if (!existsSync(baseDir)) return [];

  const currentDir = relativeDir ? path.join(baseDir, relativeDir) : baseDir;
  return readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = relativeDir ? path.posix.join(toPosixPath(relativeDir), entry.name) : entry.name;

    if (entry.isDirectory()) {
      return walkFiles(baseDir, relativePath);
    }

    return entry.isFile() ? [relativePath] : [];
  });
}

function fileChanged(sourcePath, targetPath) {
  if (!existsSync(targetPath)) return true;

  const sourceStats = statSync(sourcePath);
  const targetStats = statSync(targetPath);
  if (sourceStats.size !== targetStats.size) return true;

  return readFileSync(sourcePath).compare(readFileSync(targetPath)) !== 0;
}

function classifyPlan(sourceWikiDir, targetDir) {
  const sourceFiles = walkFiles(sourceWikiDir).sort((left, right) => left.localeCompare(right));
  const targetFiles = existsSync(targetDir) ? walkFiles(targetDir).sort((left, right) => left.localeCompare(right)) : [];
  const sourceSet = new Set(sourceFiles);
  const copies = [];
  const updates = [];
  const unchanged = [];

  for (const relativePath of sourceFiles) {
    const sourcePath = path.join(sourceWikiDir, relativePath);
    const targetPath = path.join(targetDir, relativePath);

    if (!existsSync(targetPath)) {
      copies.push(relativePath);
    } else if (fileChanged(sourcePath, targetPath)) {
      updates.push(relativePath);
    } else {
      unchanged.push(relativePath);
    }
  }

  const stale = targetFiles.filter((relativePath) => relativePath !== "README.md" && !sourceSet.has(relativePath));
  const markdownCount = sourceFiles.filter((file) => file.toLowerCase().endsWith(".md")).length;

  return {
    copies,
    markdownCount,
    otherCount: sourceFiles.length - markdownCount,
    sourceFiles,
    stale,
    unchanged,
    updates,
  };
}

function validatePaths({ appDataDir, repoRoot, sourceWikiDir, targetDir, wikiRoot }) {
  const errors = [];

  if (!existsSync(sourceWikiDir)) {
    errors.push("Source wiki folder does not exist.");
  }

  try {
    assertInside(wikiRoot, sourceWikiDir, "Source wiki path");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Source wiki path is invalid.");
  }

  if (!targetDir || !String(targetDir).trim()) {
    errors.push("Target path is empty.");
  }

  if (path.resolve(sourceWikiDir) === path.resolve(targetDir)) {
    errors.push("Target path must not be identical to source wiki path.");
  }

  if (isSameOrInside(wikiRoot, targetDir)) {
    errors.push("Target path must not be inside .local-data/llm-wiki.");
  }

  if (isSameOrInside(repoRoot, targetDir)) {
    errors.push("Target path must not be inside the website repository.");
  }

  if (isDangerousRoot(targetDir, repoRoot)) {
    errors.push("Target path is an unsafe root-like path.");
  }

  if (isSameOrInside(targetDir, sourceWikiDir)) {
    errors.push("Source wiki path must not be inside target path.");
  }

  if (isSameOrInside(targetDir, appDataDir)) {
    errors.push("App data root must not be inside target path.");
  }

  return errors;
}

function buildContext(options) {
  const repoRoot = resolveRepoRoot();
  const appDataDir = resolveAppDataDir(repoRoot);
  const wikiRoot = path.join(appDataDir, "llm-wiki");
  const sourceWikiDir = path.join(wikiRoot, "wiki");
  const targetDir = path.resolve(options.target || defaultTargetPath());
  const errors = validatePaths({ appDataDir, repoRoot, sourceWikiDir, targetDir, wikiRoot });
  const plan = errors.length || !existsSync(sourceWikiDir)
    ? { copies: [], markdownCount: 0, otherCount: 0, sourceFiles: [], stale: [], unchanged: [], updates: [] }
    : classifyPlan(sourceWikiDir, targetDir);

  return {
    appDataDir,
    errors,
    plan,
    repoRoot,
    sourceWikiDir,
    targetDir,
    wikiRoot,
  };
}

function runSync(context) {
  mkdirSync(context.targetDir, { recursive: true });

  for (const relativePath of context.plan.sourceFiles) {
    const sourcePath = assertInside(context.sourceWikiDir, path.join(context.sourceWikiDir, relativePath), "Source file");
    const targetPath = assertInside(context.targetDir, path.join(context.targetDir, relativePath), "Target file");
    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }

  writeFileSync(path.join(context.targetDir, "README.md"), MIRROR_README);
}

function publicSummary(context, options) {
  return {
    copies: context.plan.copies.length,
    dryRun: !options.run,
    errors: context.errors,
    markdownFiles: context.plan.markdownCount,
    mode: options.run ? "run" : "dry-run",
    otherFiles: context.plan.otherCount,
    sourceWikiPath: context.sourceWikiDir,
    stale: context.plan.stale.length,
    targetPath: context.targetDir,
    unchanged: context.plan.unchanged.length,
    updates: context.plan.updates.length,
  };
}

function printSummary(context, options) {
  const summary = publicSummary(context, options);

  console.log("LLM Wiki Obsidian one-way mirror");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Source wiki: ${summary.sourceWikiPath}`);
  console.log(`Target: ${summary.targetPath}`);

  if (summary.errors.length) {
    console.log(`Errors: ${summary.errors.join("; ")}`);
    console.log("No files were copied.");
    return;
  }

  console.log(`Markdown files: ${summary.markdownFiles}`);
  console.log(`Other files: ${summary.otherFiles}`);
  console.log(`Planned copies: ${summary.copies}`);
  console.log(`Planned updates: ${summary.updates}`);
  console.log(`Stale target files: ${summary.stale}`);
  console.log(`Unchanged: ${summary.unchanged}`);
  console.log(options.run ? "Sync completed. No stale files were deleted." : "No files were copied.");
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

  const context = buildContext(options);

  if (options.run && !context.errors.length) {
    runSync(context);
  }

  if (options.json) {
    console.log(JSON.stringify(publicSummary(context, options), null, 2));
  } else {
    printSummary(context, options);
  }

  return context.errors.length ? 1 : 0;
}

process.exitCode = main();
