# AGENTS.md

## Project
Next.js 16 / React 19 personal website with private project areas, shared project routes, local JSON/file stores, and an LLM-Wiki/Second-Brain feature.

## Safety rules
- Never read or print secrets.
- Never print `.env` values.
- Never print private runtime data.
- Never commit `.local-data/`.
- Never expose `APP_DATA_DIR` contents publicly.
- Never merge to `main` unless explicitly asked.
- Never deploy or access VPS unless explicitly asked.
- Never run destructive commands unless explicitly asked.

## Important private runtime paths
- Local runtime data: `.local-data/`
- LLM Wiki root: `.local-data/llm-wiki`
- LLM Wiki inbox: `.local-data/llm-wiki/inbox/pending`
- LLM Wiki raw sources: `.local-data/llm-wiki/raw`
- LLM Wiki private wiki: `.local-data/llm-wiki/wiki`

## LLM Wiki canonical model
- Canonical private truth: `.local-data/llm-wiki/wiki`
- Website captures uploads into inbox.
- Local Codex processing imports text sources.
- Obsidian is only a one-way mirror, not the backend.
- No automatic public publishing from raw/wiki/inbox.

## Common commands
- Lint: `npm.cmd run lint`
- Typecheck: `npx.cmd tsc --noEmit`
- Build: `npm.cmd run build`
- LLM Wiki dry run: `npm.cmd run llm-wiki:process -- --dry-run`
- LLM Wiki text import: `npm.cmd run llm-wiki:process -- --run`
- Obsidian mirror: `npm.cmd run llm-wiki:sync-obsidian -- --run`
- VPS inbox check: `npm.cmd run llm-wiki:pull-vps-inbox -- --dry-run --check-remote --host <host> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki`

## Working style
- Prefer small scoped changes.
- Read only the files needed for the task.
- Use `rg`/targeted file reads instead of broad tree scans.
- Do not paste long file contents into reports.
- Report concise summaries.
- Before commits, always check `git status` and ensure `.local-data/` and secrets are not staged.
- If a task is only review/diagnosis, do not modify files.

## Token-efficient workflow
- Default mode is concise.
- Do not repeat full safety rules in reports.
- Use modes: CHECK, PATCH, VALIDATE.
- CHECK: read only, no file changes.
- PATCH: change only requested files.
- VALIDATE: run `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and build only when needed.
- Prefer `rg`, `git diff --name-only`, and targeted file reads.
- Do not scan the whole repo unless needed.
- Do not print long file contents.
- Reports must use:
  - Result
  - Changed files
  - Blockers
  - Next
- Do not run build after every small change.
- Do not access VPS unless explicitly requested.
- If `next-env.d.ts` flips after `next dev`, reset/normalize it at phase end, not after every check.
