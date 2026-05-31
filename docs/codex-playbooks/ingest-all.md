# Ingest All Playbook

## Purpose
Run the complete private LLM-Wiki ingest workflow. Prefer direct VPS processing so website-visible pending items are archived in the same private runtime the website reads.

Use this playbook when the user asks approximately `ingest all`. Use `ingest quick` for the technical pipeline only and `ingest deep` for the same pipeline plus a deeper synthesis pass.

## Safety
- Never print secrets, `.env` values, private upload contents, raw source contents, wiki page contents, inbox filenames, or private runtime data.
- Never commit `.local-data/`.
- Never delete VPS files. Direct mode may move successfully processed inbox files from `pending` to `processed`.
- Never publish private raw/wiki/inbox content to the website, CDN, or public export.
- Public/CDN export requires a separate explicit approval feature later.

## Preferred Direct VPS Pipeline
When Codex runs in a VPS or Remote-SSH workspace and `/var/lib/oscarstreif/llm-wiki` exists:

1. Dry-run the direct private runtime:
   `npm.cmd run llm-wiki:ingest-direct -- --dry-run --root /var/lib/oscarstreif/llm-wiki --include-manual-review`
2. Process supported items and archive successful imports:
   `npm.cmd run llm-wiki:ingest-direct -- --run --root /var/lib/oscarstreif/llm-wiki --include-manual-review`
3. Add `--extract-pdf` when local `pdftotext` extraction is desired.
4. Run the Codex AI organization pass against new private source pages.
5. Do not sync the VPS runtime back into a complete local copy.

The website reads this same private root, so processed items stop appearing as pending after archiving.

## Local Fallback Pipeline
When Codex is local, retain the pull/local/mirror flow:

1. Pull VPS inbox:
   `npm.cmd run llm-wiki:pull-vps-inbox -- --run --host <saved-alias> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki`
2. Process pending local text/file items:
   `npm.cmd run llm-wiki:process -- --dry-run`
   `npm.cmd run llm-wiki:process -- --run --include-manual-review`
3. Skip voice items as unsupported. Treat this as a non-blocking pending manual-review state.
4. Ensure these private wiki files exist:
   - `wiki/action-tracker.md`
   - `wiki/decision-log.md`
   - `wiki/open-loops.md`
5. Sync Obsidian:
   `npm.cmd run llm-wiki:sync-obsidian -- --run`

The local fallback shortcut may use the wrapper command:

```bash
npm.cmd run llm-wiki:ingest-all
```

## AI Organization Pass
The npm script itself does not perform LLM analysis. It is deterministic and does not require an OpenAI API key.

When Codex executes `ingest all`, Codex performs the AI organization pass using the active Codex agent context. Source pages remain the evidence layer. The four master documents are the primary working surface.

- Review newly created or updated source pages.
- Deeply synthesize relevant details, relationships, risks, uncertainty, priority and next steps into only the relevant master documents:
  - `wiki/main/01-projects.md`
  - `wiki/main/02-problems.md`
  - `wiki/main/03-mentoring.md`
  - `wiki/main/04-todos-actions.md`
- Keep `wiki/main/00-overview.md` concise and navigational.
- Update existing master-document entries instead of duplicating them.
- Do not create new topic pages or thin mini-articles unless the user explicitly requests them.
- Link every durable claim, decision, task or open loop back to one or more `wiki/sources/*.md` pages.
- Update `wiki/system/source-map.md` with the source-to-main-document filing map.
- Refine `wiki/system/taxonomy.md` and `wiki/system/ingest-rules.md` only when the knowledge architecture itself changes.
- Update `wiki/action-tracker.md`.
- Update `wiki/decision-log.md`.
- Update `wiki/open-loops.md`.
- Preserve completed tasks in `wiki/main/04-todos-actions.md` with a completed status instead of deleting them.
- Update `wiki/index.md`.
- Append a short entry to `wiki/log.md`.
- Do not invent facts.
- Mark uncertain items as unresolved.
- Do not delete or overwrite source pages.
- Do not copy entire source pages into main documents and do not reduce curation to link lists; synthesize concise durable knowledge.

A website button on the VPS cannot directly run this Codex synthesis unless a separate local agent/poller is designed and approved later.

## Final Report
Report only concise counts and statuses:

- pulled items
- processed items
- skipped voice
- wiki pages updated
- action items found count
- decisions found count
- open loops count
- Obsidian mirror result
- blockers
- next suggested big feature
