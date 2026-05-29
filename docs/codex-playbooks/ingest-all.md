# Ingest All Playbook

## Purpose
Run the complete private LLM-Wiki ingest workflow from VPS inbox capture to local wiki organization and Obsidian mirror.

Use this playbook when the user asks approximately `ingest all`. Use `ingest quick` for the technical pipeline only and `ingest deep` for the same pipeline plus a deeper synthesis pass.

## Safety
- Never print secrets, `.env` values, private upload contents, raw source contents, wiki page contents, inbox filenames, or private runtime data.
- Never commit `.local-data/`.
- Never delete, move, or archive VPS files.
- Never publish private raw/wiki/inbox content to the website, CDN, or public export.
- Public/CDN export requires a separate explicit approval feature later.

## Allowed Runtime Reads/Writes
- Read and write local runtime data only under `.local-data/llm-wiki`.
- Pull remote files only from `/var/lib/oscarstreif/llm-wiki/inbox/pending`.
- Write local source imports under `.local-data/llm-wiki/raw/inbox`.
- Write private wiki pages under `.local-data/llm-wiki/wiki`.
- Update the local Obsidian one-way mirror.

## Technical Pipeline
1. Pull VPS inbox:
   `npm.cmd run llm-wiki:pull-vps-inbox -- --run --host <saved-alias> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki`
2. Process pending local text/file items:
   `npm.cmd run llm-wiki:process -- --dry-run`
   `npm.cmd run llm-wiki:process -- --run --include-manual-review`
3. Skip voice items if transcription is not configured. Treat this as a non-blocking pending transcription state.
4. Ensure these private wiki files exist:
   - `wiki/action-tracker.md`
   - `wiki/decision-log.md`
   - `wiki/open-loops.md`
5. Sync Obsidian:
   `npm.cmd run llm-wiki:sync-obsidian -- --run`

The shortcut may use the wrapper command:

```bash
npm.cmd run llm-wiki:ingest-all
```

## AI Organization Pass
The npm script itself does not perform LLM analysis. It is deterministic and does not require an OpenAI API key.

When Codex executes `ingest all`, Codex performs the AI organization pass locally using the current ChatGPT Plus/Codex agent context:

- Review newly created or updated source pages.
- Update relevant topic, entity, system and project pages.
- Update `wiki/action-tracker.md`.
- Update `wiki/decision-log.md`.
- Update `wiki/open-loops.md`.
- Update `wiki/index.md`.
- Append a short entry to `wiki/log.md`.
- Do not invent facts.
- Mark uncertain items as unresolved.
- Keep source links and backlinks.

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
