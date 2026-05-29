# Current Codex State

## Branch
`llm-wiki-upload-system`

## PR status
Draft PR exists manually on GitHub. Do not merge yet.

## Current issue
`next-env.d.ts` is dirty after build and needs normalization/cleanup.

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

## Known risks
- Public Treffpunkt POST API has no auth/rate limit/cleanup.
- WG dashboard depends on production project record.
- Shared project routes changed to standalone rendering.
- CV is placeholder.
- Do not deploy before manual checks.

## Next likely step
Normalize or reset `next-env.d.ts`, then continue manual PR checks.
