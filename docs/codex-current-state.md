# Current Codex State

## Branch
`feature/llm-wiki-four-master-docs`

## PR status
Direct VPS ingest workflow and curated knowledge architecture are merged to `main`. The VPS Production repo is synchronized without a rebuild or restart because the architecture merge changed only scripts, docs and `AGENTS.md`.

## Codex workflow
Prompts now use Prompt-ID / Response-ID. Codex may autonomously fix small safe issues, including generated-file resets, docs updates and ignored runtime-only local test records.
Reusable project lessons live in `docs/codex-lessons-learned.md`. Scan it before LLM Wiki tasks and append concise lessons when a non-obvious reusable root cause is found.

## Handoff rule
Default handoff is the Codex final chat report only. The user does not need to paste this file after every run. This file is only for recovery/resume if context is lost.

## Current issue
`next-env.d.ts` flips between dev/build route type refs. Treat it as a known artifact.

## Current task
P-LLMWIKI-053 consolidates the LLM-Wiki working surface into a concise overview and exactly four deep master documents: projects, problems, mentoring, and todos/actions. Source pages remain durable evidence and legacy main pages remain preserved.

Follow-up cleanup confirmed the working branch was correct, but the running `next dev` server had stale `.next/dev` Turbopack chunks that still contained the removed View sidebar/action UI. The dev cache was cleared and the local dev server was restarted. Maintenance / Run Lint now lives in the Ingest workspace only.

Modal polish follow-up enlarged the LLM Wiki page-opening modal, made read/edit text colors explicit for the dark UI, added useful Copy Path / Copy Content / Edit / Cancel / Save / Close actions, and kept the queryparam modal route plus removed View-clutter rules intact.

Lessons file follow-up records reusable fixes for stale production deploys, View/Ingest separation, and dark modal readability issues.

## Completed
- LLM-Wiki architecture docs
- Local processing dry-run
- Local text import
- Obsidian one-way mirror
- VPS inbox pull script with local manifest
- Branch pushed to `origin/llm-wiki-upload-system`
- Draft PR created
- PR checklist added
- Local smoke checks passed: lint, tsc, build
- Browser smoke mostly passed

## Known risks
- Public Treffpunkt POST API has no auth/rate limit/cleanup.
- WG dashboard depends on production project record.
- Shared project routes changed to standalone rendering.
- CV route is public and visible with a concise profile/CV page.
- Do not deploy before manual checks.

## Latest smoke result
Production deploy smoke checks passed after direct-ingest merge:
- `/`, `/login`, `/treffpunkt`, and `/cv` return `200`.
- `/private/llm-wiki` and `/private/llm-wiki?view=wiki` return `307` to login without auth.
- Production repo stayed clean and `oscarstreif.service` is active after restart.

## Latest LLM-Wiki runtime result
End-to-end live-to-local flow passed after deploy: remote pending was detected, local pull succeeded, one text item was imported, the voice item remained skipped pending transcription support, and the Obsidian mirror was updated.

Windows VPS inbox pull is fixed on branch `fix/llm-wiki-windows-vps-pull`: `--transport auto|scp|rsync` is supported, and Windows auto mode prefers `scp`.

## Ingest command state
`ingest all` prefers `npm.cmd run llm-wiki:ingest-direct -- --run --root /var/lib/oscarstreif/llm-wiki --include-manual-review` in a VPS or Remote-SSH workspace. The direct command is deterministic and requires no OpenAI API key. Local sessions retain the pull/process/mirror fallback.

Local synthetic validation passed for direct dry-run, processed archiving, core wiki page creation, PDF skip handling without `pdftotext`, `APP_DATA_DIR` resolution and `--no-archive`.

Live VPS validation passed from a temporary `/tmp` checkout without deploy or Production-repo changes. Direct ingest archived two supported pending items into the canonical VPS runtime, left one PDF pending as a non-blocking skip because PDF extraction was not enabled and `pdftotext` was unavailable, and created the expected source pages plus core wiki files. The temporary checkout was removed safely after verification.

Post-deploy direct-ingest dry-run passed: one PDF remains pending, two items are processed, two source pages exist, metadata is valid, and `pdftotext` is still unavailable.

P-LLMWIKI-051 additive VPS runtime initialization passed from a temporary checkout without deploy: `wiki/main` now contains six curated working documents, `wiki/system` contains three architecture documents, the existing two source pages remain intact, and the single pending PDF remains unchanged.

P-LLMWIKI-052 first private curation pass completed additively: both existing source pages are linked from the Main Workspace and Source Map, relevant Main Documents and trackers received source-linked entries, one curation log entry was appended, and the pending PDF remains unchanged.

P-LLMWIKI-053 deep consolidation completed on the private VPS runtime without deleting data: `wiki/main` now contains only `00-overview.md` plus four source-linked master documents. Six superseded main pages and three previous system files were preserved under `wiki/legacy`. Both Source Pages remain intact and mapped; the pending PDF remains unchanged.

## Recommended next step
Install and validate `pdftotext` on the VPS only when PDF extraction is intentionally enabled, then run direct ingest with `--extract-pdf`.
