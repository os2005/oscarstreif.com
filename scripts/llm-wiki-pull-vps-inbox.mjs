#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

const SUGGESTED_REMOTE_ROOT = "/var/lib/oscarstreif/llm-wiki";
const SAFE_INCLUDE_PATTERNS = ["*/", "*.json", "*.md", "*.txt", "*.webm", "*.m4a", "*.mp3", "*.wav", "*.ogg"];
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

function parseArgs(argv) {
  const options = {
    dryRun: true,
    help: false,
    host: null,
    json: false,
    localRoot: null,
    remoteRoot: null,
    run: false,
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

    if (arg === "--host" || arg === "--remote-root" || arg === "--local-root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        options.unknown.push(`${arg} requires a value`);
      } else {
        if (arg === "--host") options.host = value;
        if (arg === "--remote-root") options.remoteRoot = value;
        if (arg === "--local-root") options.localRoot = value;
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
    "Usage: npm run llm-wiki:pull-vps-inbox -- --dry-run --host <ssh-host> --remote-root <path> [--local-root <path>] [--json]",
    "",
    "Plans a safe pull from VPS llm-wiki/inbox/pending to the local pending inbox.",
    "Run mode is intentionally not implemented yet.",
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

function sanitizeRemoteRoot(value) {
  return String(value || "").replace(/\/+$/, "");
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function buildPlan(options) {
  const repoRoot = resolveRepoRoot();
  const appDataDir = resolveAppDataDir(repoRoot);
  const localRoot = path.resolve(repoRoot, options.localRoot || path.relative(repoRoot, path.join(appDataDir, "llm-wiki")));
  const localPendingPath = path.join(localRoot, "inbox", "pending");
  const remoteRoot = options.remoteRoot ? sanitizeRemoteRoot(options.remoteRoot) : null;
  const remotePendingPath = remoteRoot ? `${remoteRoot}/inbox/pending` : null;
  const expectedLocalPendingRoot = path.join(appDataDir, "llm-wiki", "inbox", "pending");
  const errors = [];
  const warnings = [];

  if (!options.host) {
    errors.push("Missing --host. Provide an explicit SSH host alias.");
  }

  if (!remoteRoot) {
    errors.push(`Missing --remote-root. Suggested value: ${SUGGESTED_REMOTE_ROOT}`);
  }

  if (remoteRoot && !remoteRoot.endsWith("/llm-wiki")) {
    warnings.push("Remote root should normally end with /llm-wiki.");
  }

  if (!isSameOrInside(expectedLocalPendingRoot, localPendingPath)) {
    errors.push("Local target must resolve inside .local-data/llm-wiki/inbox/pending.");
  }

  if (isSameOrInside(repoRoot, localPendingPath) && !isSameOrInside(appDataDir, localPendingPath)) {
    errors.push("Local target must not write into the website repository outside .local-data.");
  }

  const includeArgs = SAFE_INCLUDE_PATTERNS.flatMap((pattern) => ["--include", pattern]);
  const rsyncParts = [
    "rsync",
    "-av",
    "--protect-args",
    "--ignore-existing",
    ...includeArgs,
    "--exclude",
    "*",
    `${options.host ?? "<ssh-host>"}:${remotePendingPath ? shellQuote(`${remotePendingPath}/`) : `${SUGGESTED_REMOTE_ROOT}/inbox/pending/`}`,
    shellQuote(`${localPendingPath}${path.sep}`),
  ];

  return {
    copyPatterns: SAFE_INCLUDE_PATTERNS,
    errors,
    excludedAreas: EXCLUDED_AREAS,
    localPendingPath,
    localRoot,
    remotePendingPath: remotePendingPath || `${SUGGESTED_REMOTE_ROOT}/inbox/pending`,
    remoteRoot: remoteRoot || null,
    rsyncCommand: rsyncParts.join(" "),
    sshHost: options.host,
    suggestedRemoteRoot: SUGGESTED_REMOTE_ROOT,
    warnings,
  };
}

function publicSummary(plan, options) {
  return {
    copyPatterns: plan.copyPatterns,
    dryRun: !options.run,
    errors: plan.errors,
    excludedAreas: plan.excludedAreas,
    localPendingPath: plan.localPendingPath,
    mode: options.run ? "run" : "dry-run",
    remotePendingPath: plan.remotePendingPath,
    remoteRoot: plan.remoteRoot,
    rsyncCommand: plan.rsyncCommand,
    sshHost: plan.sshHost,
    suggestedRemoteRoot: plan.suggestedRemoteRoot,
    warnings: plan.warnings,
  };
}

function printPlan(plan, options) {
  console.log("LLM Wiki VPS inbox pull dry-run");
  console.log(`Mode: ${options.run ? "run" : "dry-run"}`);

  if (plan.errors.length) {
    console.log(`Errors: ${plan.errors.join("; ")}`);
  }

  if (plan.warnings.length) {
    console.log(`Warnings: ${plan.warnings.join("; ")}`);
  }

  console.log(`SSH host: ${plan.sshHost ?? "(required)"}`);
  console.log(`Remote pending path: ${plan.remotePendingPath}`);
  console.log(`Local pending path: ${plan.localPendingPath}`);
  console.log(`Copy patterns: ${plan.copyPatterns.join(", ")}`);
  console.log(`Excluded areas: ${plan.excludedAreas.join(", ")}`);
  console.log("Planned safe command:");
  console.log(plan.rsyncCommand);
  console.log("No remote command was executed.");
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

  if (options.run) {
    console.error("Run mode not implemented yet. Review dry-run plan first.");
    return 2;
  }

  const plan = buildPlan(options);

  if (options.json) {
    console.log(JSON.stringify(publicSummary(plan, options), null, 2));
  } else {
    printPlan(plan, options);
  }

  return plan.errors.length ? 2 : 0;
}

process.exitCode = main();
