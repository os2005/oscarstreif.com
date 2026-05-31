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
- Direct VPS runtime data: `/var/lib/oscarstreif/llm-wiki`
- LLM Wiki root: `.local-data/llm-wiki`
- LLM Wiki inbox: `.local-data/llm-wiki/inbox/pending`
- LLM Wiki raw sources: `.local-data/llm-wiki/raw`
- LLM Wiki private wiki: `.local-data/llm-wiki/wiki`

## LLM Wiki canonical model
- Canonical private truth on VPS: `APP_DATA_DIR/llm-wiki/wiki`
- Local fallback truth: `.local-data/llm-wiki/wiki`
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
- LLM Wiki direct VPS import: `npm.cmd run llm-wiki:ingest-direct -- --run --root /var/lib/oscarstreif/llm-wiki --include-manual-review`
- Obsidian mirror: `npm.cmd run llm-wiki:sync-obsidian -- --run`
- VPS inbox check: `npm.cmd run llm-wiki:pull-vps-inbox -- --dry-run --check-remote --host <host> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki`

## Working style
- Prefer small scoped changes.
- Read only the files needed for the task.
- Use `rg`/targeted file reads instead of broad tree scans.
- Do not paste long file contents into reports.
- Before LLM Wiki tasks, quickly scan `docs/codex-lessons-learned.md` for relevant known failure patterns.
- After a task, append a concise lesson to `docs/codex-lessons-learned.md` only when a non-obvious reusable bug/root cause was found.
- Report concise summaries.
- Before commits, always check `git status` and ensure `.local-data/` and secrets are not staged.
- Missing `gh` is not an automatic stop for an explicitly approved merge. First try normal Git safely: fetch, update local `main` with `--ff-only`, merge the pushed remote feature branch with `--no-ff`, validate, then push `main`. Stop only for real GitHub or permission blockers such as conflicts, missing push rights, or branch protection.
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

## Autonomous problem solving
- If a task reveals a small safe issue, fix it directly.
- Safe fixes include: resetting generated files, updating docs, adding ignored runtime-only local test records, correcting obvious non-functional config drift.
- Unsafe fixes require reporting only: auth changes, public API changes, deployment changes, VPS changes, database/runtime production changes, privacy/security behavior changes.
- For each task, use an ID:
  - Prompt-ID: `P-...`
  - Response-ID: matching `A-...`
- Reports must start with the matching Response-ID.
- Prefer solving within the same task instead of asking for another prompt.
- Use minimal validation after fixes.
- Keep reports short.

## One-copy handoff
- The user should only need to copy the final Codex chat report back to ChatGPT.
- Do not require the user to also paste `docs/codex-current-state.md`.
- Keep `docs/codex-current-state.md` updated internally when state changes.
- Every final report must include enough state for ChatGPT to continue:
  - Response-ID
  - Result
  - Changed files
  - Commit / Push
  - Current blockers
  - Current next step
  - Whether git is clean and synced
- If a task updates state docs, summarize the relevant state in the final report.
- If ChatGPT needs deeper context later, tell the user to paste only `docs/codex-current-state.md`, not both.

## User shortcuts
If the user writes exactly or approximately:

`ingest all`

then execute the playbook:

`docs/codex-playbooks/ingest-all.md`

Meaning:
- Prefer direct VPS ingest when `/var/lib/oscarstreif/llm-wiki` exists or Remote SSH is detected.
- Otherwise use the pull/local/mirror fallback flow.
- Process website-visible pending items in the canonical VPS runtime when direct mode is available.
- Run AI organization pass over new sources.
- Update action tracker, decision log, open loops.
- Sync Obsidian mirror.
- Report concise summary only.
- Do not deploy.
- Do not publish private content.

Optional shortcuts:
- `ingest quick` = run technical pipeline only, no deep AI organization.
- `ingest deep` = run technical pipeline plus deeper wiki synthesis.
