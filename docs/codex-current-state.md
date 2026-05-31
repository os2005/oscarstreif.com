# Current Codex State

## Branch
`feature/llm-wiki-direct-vps-ingest`

## PR status
LLM Wiki UI redesign and modal polish are merged to `main` and deployed.

## Codex workflow
Prompts now use Prompt-ID / Response-ID. Codex may autonomously fix small safe issues, including generated-file resets, docs updates and ignored runtime-only local test records.
Reusable project lessons live in `docs/codex-lessons-learned.md`. Scan it before LLM Wiki tasks and append concise lessons when a non-obvious reusable root cause is found.

## Handoff rule
Default handoff is the Codex final chat report only. The user does not need to paste this file after every run. This file is only for recovery/resume if context is lost.

## Current issue
`next-env.d.ts` flips between dev/build route type refs. Treat it as a known artifact.

## Current task
P-LLMWIKI-046R adds a direct VPS ingest workflow for Remote-SSH Codex sessions. The preferred `ingest all` path now processes `/var/lib/oscarstreif/llm-wiki` in place so website-visible pending items are archived in the canonical VPS runtime. Local pull/process/mirror remains the fallback.

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
- CV is placeholder.
- Do not deploy before manual checks.

## Latest smoke result
Local smoke checks passed:
- WG dashboard route no longer 404 after runtime-only local Project Record.
- Treffpunkt dummy POST/GET passed.
- `/private/llm-wiki` redirects to login without auth.
- `/cv` loads with placeholder.
- `next-env.d.ts` was reset after dev-server flip.
- Git status clean and synced with origin.

## Latest LLM-Wiki runtime result
End-to-end live-to-local flow passed after deploy: remote pending was detected, local pull succeeded, one text item was imported, the voice item remained skipped pending transcription support, and the Obsidian mirror was updated.

Windows VPS inbox pull is fixed on branch `fix/llm-wiki-windows-vps-pull`: `--transport auto|scp|rsync` is supported, and Windows auto mode prefers `scp`.

## Ingest command state
`ingest all` prefers `npm.cmd run llm-wiki:ingest-direct -- --run --root /var/lib/oscarstreif/llm-wiki --include-manual-review` in a VPS or Remote-SSH workspace. The direct command is deterministic and requires no OpenAI API key. Local sessions retain the pull/process/mirror fallback.

Local synthetic validation passed for direct dry-run, processed archiving, core wiki page creation, PDF skip handling without `pdftotext`, `APP_DATA_DIR` resolution and `--no-archive`.

Live VPS validation passed from a temporary `/tmp` checkout without deploy or Production-repo changes. Direct ingest archived two supported pending items into the canonical VPS runtime, left one PDF pending as a non-blocking skip because PDF extraction was not enabled and `pdftotext` was unavailable, and created the expected source pages plus core wiki files. The temporary checkout was removed safely after verification.

## Final human decisions before merge
- Confirm CV placeholder is acceptable for production.
- Confirm public Treffpunkt POST API without auth/rate limit/cleanup is acceptable for first deploy, or decide to harden before merge.

## Recommended next step
If both final human decisions are accepted: mark Draft PR ready for review, merge into `main`, then deploy carefully.
