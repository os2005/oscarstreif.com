#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REMOTE_ROOT = "/var/lib/oscarstreif/llm-wiki";
const LOCAL_ROOT = ".local-data/llm-wiki";
const CORE_WIKI_FILES = [
  {
    path: "action-tracker.md",
    title: "Action Tracker",
    body: "Tracked actions extracted during Codex organization passes. Do not invent items; link back to source pages.",
  },
  {
    path: "decision-log.md",
    title: "Decision Log",
    body: "Durable decisions extracted during Codex organization passes. Preserve uncertainty and cite source pages.",
  },
  {
    path: "open-loops.md",
    title: "Open Loops",
    body: "Open questions, unresolved follow-ups and pending review items. Mark uncertain items as unresolved.",
  },
];

function parseArgs(argv) {
  const options = {
    dryRun: false,
    json: false,
    skipObsidian: false,
    skipProcess: false,
    skipPull: false,
    unknown: [],
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--skip-pull") {
      options.skipPull = true;
      continue;
    }

    if (arg === "--skip-process") {
      options.skipProcess = true;
      continue;
    }

    if (arg === "--skip-obsidian") {
      options.skipObsidian = true;
      continue;
    }

    options.unknown.push(arg);
  }

  return options;
}

function usage() {
  return [
    "Usage: npm run llm-wiki:ingest-all -- [--dry-run] [--skip-pull] [--skip-process] [--skip-obsidian] [--json]",
    "",
    "Runs the deterministic technical LLM-Wiki ingest pipeline.",
    "It does not perform LLM synthesis; Codex performs that pass when using the ingest-all playbook.",
  ].join("\n");
}

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function readLocalConfig(root) {
  const configPath = path.join(root, ".local-data", "codex-local-config.json");
  if (!existsSync(configPath)) return {};

  try {
    return JSON.parse(readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return {};
  }
}

function commandAvailable(command) {
  const checker = process.platform === "win32" ? "where.exe" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(checker, args, { encoding: "utf8", shell: process.platform !== "win32", windowsHide: true });
  return !result.error && result.status === 0;
}

function detectVoiceTools() {
  const commands = ["ffmpeg", "whisper", "faster-whisper", "whisper.cpp"];
  return Object.fromEntries(commands.map((command) => [command, commandAvailable(command)]));
}

function runNodeScript(root, script, args) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
    windowsHide: true,
  });

  return {
    error: result.error?.message,
    stderr: result.stderr,
    stdout: result.stdout,
    status: result.status ?? 1,
  };
}

function parseJsonOutput(output) {
  const index = output.indexOf("{");
  if (index === -1) return null;

  try {
    return JSON.parse(output.slice(index));
  } catch {
    return null;
  }
}

function ensureCoreWikiFiles(root, dryRun) {
  const wikiDir = path.join(root, LOCAL_ROOT, "wiki");
  const result = {
    created: 0,
    existing: 0,
    planned: 0,
  };

  for (const file of CORE_WIKI_FILES) {
    const target = path.join(wikiDir, file.path);
    if (existsSync(target)) {
      result.existing += 1;
      continue;
    }

    if (dryRun) {
      result.planned += 1;
      continue;
    }

    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, [`# ${file.title}`, "", file.body, "", "## Items", "", "- None recorded yet.", ""].join("\n"));
    result.created += 1;
  }

  return result;
}

function summarizeProcess(summary) {
  if (!summary) {
    return {
      failed: null,
      invalid: null,
      pending: null,
      processed: null,
      skipped: null,
      text: null,
      voice: null,
    };
  }

  return {
    failed: summary.failed?.length ?? 0,
    invalid: summary.invalidItems?.length ?? 0,
    pending: summary.pendingCount ?? 0,
    processed: summary.processed?.length ?? 0,
    skipped: summary.skipped?.length ?? 0,
    text: summary.totalsByKind?.text ?? 0,
    voice: summary.totalsByKind?.voice ?? 0,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.unknown.length) {
    console.error(`Invalid option(s): ${options.unknown.join(", ")}`);
    console.error(usage());
    return 2;
  }

  const root = repoRoot();
  const localConfig = readLocalConfig(root);
  const sshHost = typeof localConfig.vpsSshAlias === "string" && localConfig.vpsSshAlias.trim() ? localConfig.vpsSshAlias.trim() : null;
  const blockers = [];
  const voiceTools = detectVoiceTools();
  const voiceTranscriptionConfigured = voiceTools.ffmpeg && (voiceTools.whisper || voiceTools["faster-whisper"] || voiceTools["whisper.cpp"]);
  const summary = {
    blockers,
    coreWikiFiles: null,
    dryRun: options.dryRun,
    localProcessingDryRun: null,
    localProcessingRun: null,
    obsidianMirror: null,
    pull: null,
    skipped: {
      obsidian: options.skipObsidian,
      process: options.skipProcess,
      pull: options.skipPull,
    },
    voice: {
      tools: voiceTools,
      transcriptionConfigured: voiceTranscriptionConfigured,
      status: voiceTranscriptionConfigured ? "transcription tools detected" : "voice skipped: transcription not configured",
    },
  };

  if (!options.skipPull) {
    if (!sshHost) {
      blockers.push("Missing saved VPS SSH alias in .local-data/codex-local-config.json.");
    } else {
      const pullArgs = [
        options.dryRun ? "--dry-run" : "--run",
        "--host",
        sshHost,
        "--remote-root",
        REMOTE_ROOT,
        "--local-root",
        LOCAL_ROOT,
        "--transport",
        "auto",
        "--json",
      ];
      const pullResult = runNodeScript(root, "scripts/llm-wiki-pull-vps-inbox.mjs", pullArgs);
      const pullSummary = parseJsonOutput(pullResult.stdout);
      summary.pull = {
        downloaded: pullSummary?.downloaded ?? null,
        errors: pullSummary?.errors?.length ?? null,
        remoteFiles: pullSummary?.remoteFilesFound ?? null,
        skippedAlreadyPulled: pullSummary?.skippedAlreadyPulled ?? null,
        skippedCollision: pullSummary?.skippedCollision ?? null,
        status: pullResult.status,
        transport: pullSummary?.transport ?? null,
      };

      if (pullResult.status !== 0 || (pullSummary?.errors?.length ?? 0) > 0) {
        blockers.push("VPS inbox pull reported an error.");
      }
    }
  }

  if (!options.skipProcess) {
    const dryResult = runNodeScript(root, "scripts/llm-wiki-process-local.mjs", ["--dry-run", "--json"]);
    const drySummary = parseJsonOutput(dryResult.stdout);
    summary.localProcessingDryRun = {
      ...summarizeProcess(drySummary),
      status: dryResult.status,
    };

    if (dryResult.status !== 0) {
      blockers.push("Local processing dry-run failed.");
    }

    if (!options.dryRun) {
      const runResult = runNodeScript(root, "scripts/llm-wiki-process-local.mjs", ["--run", "--include-manual-review", "--json"]);
      const runSummary = parseJsonOutput(runResult.stdout);
      summary.localProcessingRun = {
        ...summarizeProcess(runSummary),
        status: runResult.status,
      };

      if (runResult.status !== 0 || (runSummary?.failed?.length ?? 0) > 0) {
        blockers.push("Local processing run failed.");
      }
    }
  }

  summary.coreWikiFiles = ensureCoreWikiFiles(root, options.dryRun);

  if (!options.skipObsidian) {
    const obsidianArgs = [options.dryRun ? "--dry-run" : "--run", "--json"];
    const obsidianResult = runNodeScript(root, "scripts/llm-wiki-sync-obsidian.mjs", obsidianArgs);
    const obsidianSummary = parseJsonOutput(obsidianResult.stdout);
    summary.obsidianMirror = {
      copies: obsidianSummary?.copies ?? null,
      errors: obsidianSummary?.errors?.length ?? null,
      markdownFiles: obsidianSummary?.markdownFiles ?? null,
      status: obsidianResult.status,
      stale: obsidianSummary?.stale ?? null,
      unchanged: obsidianSummary?.unchanged ?? null,
      updates: obsidianSummary?.updates ?? null,
    };

    if (obsidianResult.status !== 0 || (obsidianSummary?.errors?.length ?? 0) > 0) {
      blockers.push("Obsidian mirror sync failed.");
    }
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("LLM Wiki ingest-all technical pipeline");
    console.log(`Mode: ${options.dryRun ? "dry-run" : "run"}`);
    console.log(`Pull: ${options.skipPull ? "skipped" : `status=${summary.pull?.status}, downloaded=${summary.pull?.downloaded}, remoteFiles=${summary.pull?.remoteFiles}, transport=${summary.pull?.transport}`}`);
    console.log(`Processing dry-run: ${options.skipProcess ? "skipped" : `pending=${summary.localProcessingDryRun?.pending}, text=${summary.localProcessingDryRun?.text}, voice=${summary.localProcessingDryRun?.voice}`}`);
    console.log(`Processing run: ${options.skipProcess || options.dryRun ? "skipped" : `processed=${summary.localProcessingRun?.processed}, skipped=${summary.localProcessingRun?.skipped}, failed=${summary.localProcessingRun?.failed}`}`);
    console.log(`Core wiki files: created=${summary.coreWikiFiles.created}, existing=${summary.coreWikiFiles.existing}, planned=${summary.coreWikiFiles.planned}`);
    console.log(`Voice: ${summary.voice.status}`);
    console.log(`Obsidian: ${options.skipObsidian ? "skipped" : `status=${summary.obsidianMirror?.status}, markdown=${summary.obsidianMirror?.markdownFiles}, copies=${summary.obsidianMirror?.copies}, updates=${summary.obsidianMirror?.updates}`}`);
    console.log(`Blockers: ${blockers.length}`);
  }

  return blockers.length ? 2 : 0;
}

process.exitCode = main();
