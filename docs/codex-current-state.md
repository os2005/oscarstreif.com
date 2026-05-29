# Current Codex State

## Branch
`llm-wiki-upload-system`

## PR status
Draft PR exists manually on GitHub. Do not merge yet.

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

## Remaining manual checks
1. Admin login `/private/llm-wiki`
2. WG Project Record / `/shared/wg-project-dashboard`
3. Treffpunkt dummy POST/GET if allowed
4. CV placeholder intentional?

## Next efficient step
Reset/normalize `next-env.d.ts`, then run only targeted manual checks.
