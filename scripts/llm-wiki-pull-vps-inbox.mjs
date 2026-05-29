#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MANIFEST_VERSION = 1;
const SUGGESTED_REMOTE_ROOT = "/var/lib/oscarstreif/llm-wiki";
const COPY_SCOPE = "all files under remote llm-wiki/inbox/pending, excluding obvious secret/auth names";
const EXCLUDED_AREAS = [
  "/var/lib/oscarstreif",
  "auth-store.json",
  "sessions",
  ".env",
  ".env.*",
  "llm-wiki/raw",
  "llm-wiki/wiki",
  "llm-wiki/schema.md",
];
const EXCLUDED_REMOTE_NAMES = new Set([".env", "auth-store.json"]);

function parseArgs(argv) {
  const options = {
    checkRemote: false,
    dryRun: true,
    force: false,
    help: false,
    host: null,
    json: false,
    localRoot: null,
    remoteRoot: null,
    run: false,
    transport: "auto",
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

    if (arg === "--check-remote") {
      options.checkRemote = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
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

    if (arg === "--host" || arg === "--remote-root" || arg === "--local-root" || arg === "--transport") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        options.unknown.push(`${arg} requires a value`);
      } else {
        if (arg === "--host") options.host = value;
        if (arg === "--remote-root") options.remoteRoot = value;
        if (arg === "--local-root") options.localRoot = value;
        if (arg === "--transport") options.transport = value;
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
    "Usage: npm run llm-wiki:pull-vps-inbox -- --dry-run --host <ssh-host> --remote-root <path> [--local-root <path>] [--transport auto|scp|rsync] [--json]",
    "       npm run llm-wiki:pull-vps-inbox -- --run --host <ssh-host> --remote-root <path> [--local-root <path>] [--transport auto|scp|rsync] [--force] [--json]",
    "",
    "Pulls only VPS llm-wiki/inbox/pending files into the local pending inbox.",
    "Dry-run does not connect to the remote host unless --check-remote is set.",
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

function isSameOrInside(parent, candidate) {
  const resolvedParent = path.resolve(parent);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedParent, resolvedCandidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function toPosixPath(value) {
  return String(value).replace(/\\/g, "/");
}

function sanitizeRemoteRoot(value) {
  return toPosixPath(String(value || "").replace(/\/+$/, ""));
}

function posixQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function shellDisplayQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function commandAvailable(command) {
  const checker = process.platform === "win32" ? "where.exe" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(checker, args, { encoding: "utf8", shell: process.platform !== "win32", windowsHide: true });
  return !result.error && result.status === 0;
}

function selectTransport(available, requestedTransport) {
  if (requestedTransport === "scp") return available.scp ? "scp" : "none";
  if (requestedTransport === "rsync") return available.rsync ? "rsync" : "none";

  if (process.platform === "win32") {
    return available.scp ? "scp" : available.rsync ? "rsync" : "none";
  }

  return {
    available,
    selected: available.rsync ? "rsync" : available.scp ? "scp" : "none",
  }.selected;
}

function detectTransports(requestedTransport = "auto") {
  const available = {
    rsync: commandAvailable("rsync"),
    scp: commandAvailable("scp"),
    ssh: commandAvailable("ssh"),
  };

  return {
    available,
    selected: selectTransport(available, requestedTransport),
  };
}

function safeRemoteRelativePath(relativePath) {
  const normalized = toPosixPath(relativePath).replace(/^\.?\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..")) return null;
  if (!/^[A-Za-z0-9._/-]+$/.test(normalized)) return null;

  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || EXCLUDED_REMOTE_NAMES.has(segment) || segment.startsWith(".env"))) {
    return null;
  }

  return normalized;
}

function buildPlan(options) {
  const repoRoot = resolveRepoRoot();
  const appDataDir = resolveAppDataDir(repoRoot);
  const wikiRoot = path.join(appDataDir, "llm-wiki");
  const localRoot = path.resolve(repoRoot, options.localRoot || path.relative(repoRoot, wikiRoot));
  const localPendingPath = path.join(localRoot, "inbox", "pending");
  const manifestPath = path.join(localRoot, "transfer", "pulled-vps-inbox.json");
  const remoteRoot = options.remoteRoot ? sanitizeRemoteRoot(options.remoteRoot) : null;
  const remotePendingPath = remoteRoot ? `${remoteRoot}/inbox/pending` : null;
  const expectedLocalPendingRoot = path.join(wikiRoot, "inbox", "pending");
  const transports = detectTransports(options.transport);
  const errors = [];
  const warnings = [];

  if (!options.host) {
    errors.push("Missing --host. Provide an explicit SSH host alias.");
  }

  if (!["auto", "scp", "rsync"].includes(options.transport)) {
    errors.push("--transport must be one of: auto, scp, rsync.");
  }

  if (!remoteRoot) {
    errors.push(`Missing --remote-root. Suggested value: ${SUGGESTED_REMOTE_ROOT}`);
  }

  if (remoteRoot && !remoteRoot.endsWith("/llm-wiki")) {
    errors.push("Remote root must point to the llm-wiki root and end with /llm-wiki.");
  }

  if (remotePendingPath && !remotePendingPath.endsWith("/llm-wiki/inbox/pending")) {
    errors.push("Remote pending path must resolve to /llm-wiki/inbox/pending.");
  }

  if (!isSameOrInside(expectedLocalPendingRoot, localPendingPath)) {
    errors.push("Local target must resolve inside .local-data/llm-wiki/inbox/pending.");
  }

  if (isSameOrInside(repoRoot, localPendingPath) && !isSameOrInside(appDataDir, localPendingPath)) {
    errors.push("Local target must not write into the website repository outside .local-data.");
  }

  if (options.run || options.checkRemote) {
    if (!transports.available.ssh) {
      errors.push("ssh is required for remote listing but was not found locally.");
    }

    if (options.run && transports.selected === "none") {
      errors.push(
        options.transport === "auto"
          ? "rsync or scp is required for run mode but neither was found locally."
          : `${options.transport} was requested but was not found locally.`
      );
    }
  }

  if (options.force) {
    warnings.push("--force bypasses the manifest but still refuses local filename collisions.");
  }

  return {
    appDataDir,
    copyScope: COPY_SCOPE,
    errors,
    excludedAreas: EXCLUDED_AREAS,
    localPendingPath,
    localRoot,
    manifestPath,
    remotePendingPath: remotePendingPath || `${SUGGESTED_REMOTE_ROOT}/inbox/pending`,
    remoteRoot: remoteRoot || null,
    repoRoot,
    sshHost: options.host,
    suggestedRemoteRoot: SUGGESTED_REMOTE_ROOT,
    transports,
    warnings,
    wikiRoot,
  };
}

function remoteListCommand(remotePendingPath) {
  const quoted = posixQuote(remotePendingPath);
  return [
    `test -d ${quoted}`,
    `cd ${quoted}`,
    "find . -type f ! -name '.env' ! -name '.env.*' ! -name 'auth-store.json' -printf '%P\\t%s\\t%T@\\n'",
  ].join(" && ");
}

function runCommand(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
    windowsHide: true,
  });
}

function listRemoteFiles(plan) {
  const result = runCommand("ssh", [plan.sshHost, remoteListCommand(plan.remotePendingPath)]);

  if (result.error) {
    throw new Error(`Remote listing failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error("Remote listing failed. Check SSH host and remote pending path.");
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [relativePath, size, mtime] = line.split("\t");
      const safeRelativePath = safeRemoteRelativePath(relativePath);
      if (!safeRelativePath) return null;

      return {
        basename: path.posix.basename(safeRelativePath),
        mtime: mtime || undefined,
        relativePath: safeRelativePath,
        remotePath: `${plan.remotePendingPath}/${safeRelativePath}`,
        size: Number(size) || undefined,
      };
    })
    .filter(Boolean);
}

function readManifest(manifestPath) {
  if (!existsSync(manifestPath)) {
    return { pulledItems: [], updatedAt: null, version: MANIFEST_VERSION };
  }

  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    return {
      pulledItems: Array.isArray(parsed.pulledItems) ? parsed.pulledItems : [],
      remoteHost: parsed.remoteHost,
      remoteRoot: parsed.remoteRoot,
      updatedAt: parsed.updatedAt,
      version: parsed.version || MANIFEST_VERSION,
    };
  } catch {
    return { pulledItems: [], updatedAt: null, version: MANIFEST_VERSION };
  }
}

function writeManifest(manifestPath, manifest) {
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  const tempPath = `${manifestPath}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(tempPath, manifestPath);
}

function localTargetPath(plan, remoteFile) {
  return path.join(plan.localPendingPath, remoteFile.relativePath);
}

function pullWithScp(plan, remoteFile, targetPath) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  return runCommand("scp", ["-p", `${plan.sshHost}:${remoteFile.remotePath}`, targetPath]);
}

function pullWithRsync(plan, remoteFile, targetPath) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  return runCommand("rsync", ["-a", "--protect-args", "--ignore-existing", `${plan.sshHost}:${remoteFile.remotePath}`, targetPath]);
}

function runPull(plan, options) {
  const remoteFiles = listRemoteFiles(plan);
  const manifest = readManifest(plan.manifestPath);
  const pulledRemotePaths = new Set(manifest.pulledItems.map((item) => item.remotePath));
  const downloaded = [];
  const errors = [];
  const skippedAlreadyPulled = [];
  const skippedCollision = [];

  mkdirSync(plan.localPendingPath, { recursive: true });

  for (const remoteFile of remoteFiles) {
    const targetPath = localTargetPath(plan, remoteFile);

    if (!options.force && pulledRemotePaths.has(remoteFile.remotePath)) {
      skippedAlreadyPulled.push(remoteFile.remotePath);
      continue;
    }

    if (existsSync(targetPath)) {
      skippedCollision.push(remoteFile.remotePath);
      continue;
    }

    const result =
      plan.transports.selected === "rsync" ? pullWithRsync(plan, remoteFile, targetPath) : pullWithScp(plan, remoteFile, targetPath);

    if (result.error || result.status !== 0) {
      errors.push({ error: result.error?.message || "Transfer command failed.", remotePath: remoteFile.remotePath });
      continue;
    }

    const pulledAt = new Date().toISOString();
    const localPath = path.relative(plan.wikiRoot, targetPath).replace(/\\/g, "/");
    downloaded.push(remoteFile.remotePath);
    manifest.pulledItems.push({
      basename: remoteFile.basename,
      localPath,
      method: plan.transports.selected,
      mtime: remoteFile.mtime,
      pulledAt,
      remotePath: remoteFile.remotePath,
      size: remoteFile.size,
    });
  }

  if (downloaded.length) {
    manifest.remoteHost = options.host;
    manifest.remoteRoot = plan.remoteRoot;
    manifest.updatedAt = new Date().toISOString();
    manifest.version = MANIFEST_VERSION;
    writeManifest(plan.manifestPath, manifest);
  }

  return {
    downloaded,
    errors,
    remoteFiles,
    skippedAlreadyPulled,
    skippedCollision,
  };
}

function plannedCommand(plan) {
  if (plan.transports.selected === "scp") {
    return [
      "scp",
      "-p",
      `${plan.sshHost ?? "<ssh-host>"}:${shellDisplayQuote(`${plan.remotePendingPath}/<file>`)}`,
      shellDisplayQuote(path.join(plan.localPendingPath, "<file>")),
    ].join(" ");
  }

  return [
    "rsync",
    "-a",
    "--protect-args",
    "--ignore-existing",
    `${plan.sshHost ?? "<ssh-host>"}:${shellDisplayQuote(`${plan.remotePendingPath}/<file>`)}`,
    shellDisplayQuote(path.join(plan.localPendingPath, "<file>")),
  ].join(" ");
}

function publicSummary(plan, options, runResult = null) {
  return {
    dryRun: !options.run,
    errors: [...plan.errors, ...(runResult?.errors?.map((item) => item.error) ?? [])],
    excludedAreas: plan.excludedAreas,
    force: options.force,
    host: options.host,
    localPendingPath: plan.localPendingPath,
    manifestPath: plan.manifestPath,
    mode: options.run ? "run" : "dry-run",
    remoteFilesFound: runResult?.remoteFiles?.length ?? null,
    remotePendingPath: plan.remotePendingPath,
    remoteRoot: plan.remoteRoot,
    rsyncCommand: plannedCommand(plan),
    skippedAlreadyPulled: runResult?.skippedAlreadyPulled?.length ?? 0,
    skippedCollision: runResult?.skippedCollision?.length ?? 0,
    downloaded: runResult?.downloaded?.length ?? 0,
    transport: plan.transports.selected,
    transportRequested: options.transport,
    transportAvailable: plan.transports.available,
    warnings: plan.warnings,
  };
}

function printPlan(summary, options) {
  console.log("LLM Wiki VPS inbox pull");
  console.log(`Mode: ${summary.mode}`);
  console.log(`SSH host: ${summary.host ?? "(required)"}`);
  console.log(`Remote pending path: ${summary.remotePendingPath}`);
  console.log(`Local pending path: ${summary.localPendingPath}`);
  console.log(`Manifest path: ${summary.manifestPath}`);
  console.log(`Transport: ${summary.transport}`);
  console.log(`Remote files found: ${summary.remoteFilesFound ?? "(not checked)"}`);
  console.log(`Downloaded: ${summary.downloaded}`);
  console.log(`Skipped already pulled: ${summary.skippedAlreadyPulled}`);
  console.log(`Skipped collisions: ${summary.skippedCollision}`);

  if (summary.errors.length) {
    console.log(`Errors: ${summary.errors.join("; ")}`);
  }

  if (summary.warnings.length) {
    console.log(`Warnings: ${summary.warnings.join("; ")}`);
  }

  console.log(`Copy scope: ${COPY_SCOPE}`);
  console.log(`Excluded areas: ${summary.excludedAreas.join(", ")}`);
  console.log("Planned safe command:");
  console.log(summary.rsyncCommand);
  if (summary.errors.length) {
    console.log("No files were downloaded.");
  } else {
    console.log(options.run ? "Run completed without remote deletion or remote moves." : "No remote command was executed.");
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

  const plan = buildPlan(options);
  let runResult = null;

  try {
    if (!plan.errors.length && (options.run || options.checkRemote)) {
      runResult = options.run
        ? runPull(plan, options)
        : { downloaded: [], errors: [], remoteFiles: listRemoteFiles(plan), skippedAlreadyPulled: [], skippedCollision: [] };
    }
  } catch (error) {
    runResult = {
      downloaded: [],
      errors: [{ error: error instanceof Error ? error.message : "Remote operation failed." }],
      remoteFiles: [],
      skippedAlreadyPulled: [],
      skippedCollision: [],
    };
  }

  const summary = publicSummary(plan, options, runResult);

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printPlan(summary, options);
  }

  return summary.errors.length ? 2 : 0;
}

process.exitCode = main();
