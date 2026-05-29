# Current Codex State

## Branch
`llm-wiki-upload-system`

## PR status
Draft PR exists manually on GitHub. Do not merge yet.

## Codex workflow
Prompts now use Prompt-ID / Response-ID. Codex may autonomously fix small safe issues, including generated-file resets, docs updates and ignored runtime-only local test records.

## Handoff rule
Default handoff is the Codex final chat report only. The user does not need to paste this file after every run. This file is only for recovery/resume if context is lost.

## Current issue
`next-env.d.ts` flips between dev/build route type refs. Treat it as a known artifact.

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

## Final human decisions before merge
- Confirm CV placeholder is acceptable for production.
- Confirm public Treffpunkt POST API without auth/rate limit/cleanup is acceptable for first deploy, or decide to harden before merge.

## Recommended next step
If both final human decisions are accepted: mark Draft PR ready for review, merge into `main`, then deploy carefully.
