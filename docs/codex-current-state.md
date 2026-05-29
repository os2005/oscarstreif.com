# Current Codex State

## Branch
`llm-wiki-upload-system`

## PR status
Draft PR exists manually on GitHub. Do not merge yet.

## Codex workflow
Prompts now use Prompt-ID / Response-ID. Codex may autonomously fix small safe issues, including generated-file resets, docs updates and ignored runtime-only local test records.

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
1. WG dashboard local Project Record
2. Treffpunkt dummy POST/GET
3. `/private/llm-wiki` redirect/admin gate
4. `/cv` placeholder confirmation
5. Reset `next-env.d.ts` if dev server flips it

## Next efficient step
Reset/normalize `next-env.d.ts`, then run only targeted manual checks.
