# Codex Lessons Learned

Lightweight reusable notes for recurring Codex/project mistakes. Before starting an LLM Wiki task, quickly scan this file for relevant known issues. After finishing a task, append a short lesson only when a non-obvious bug or root cause was found.

## Recurring Failure Patterns

### LLMWIKI-DEPLOY-STALE-PROD

- ID: `LLMWIKI-DEPLOY-STALE-PROD`
- Problem pattern: Local dev/build passes, but production UI still shows old state.
- Symptoms: Local branch looks correct, production `https://oscarstreif.com/private/llm-wiki` still renders removed UI or old behavior.
- Root cause: Feature branch or local commit was not deployed to production, or the VPS still runs old `main` / old `.next` build.
- Correct fix: Check deployed commit on VPS, merge/cherry-pick to `main` if production deploys from `main`, pull on `/var/www/oscarstreif.com/current`, remove `.next`, run `npm ci`, run `npm run build`, restart `oscarstreif.service`, then verify production.
- Verification steps: Confirm commit hash, fresh build time, active systemd PID, production route response, and expected marker presence or stale UI-label absence in production build artifacts.
- Related files/commands: `README.md`, `deploy/systemd/oscarstreif.service`, `deploy/nginx/oscarstreif.com.conf`, `git rev-parse --short HEAD`, `rm -rf .next`, `npm ci`, `npm run build`, `systemctl restart oscarstreif.service`, `journalctl -u oscarstreif.service`.

### LLMWIKI-VIEW-INGEST-SEPARATION

- ID: `LLMWIKI-VIEW-INGEST-SEPARATION`
- Problem pattern: View page becomes cluttered with capture/upload/source/maintenance actions.
- Symptoms: `/private/llm-wiki?view=wiki` shows ingest controls, action sidebars, or maintenance buttons while trying to browse pages.
- Root cause: Capture and management UI leaked into the View workspace instead of staying in the Ingest workspace.
- Correct fix: Keep View only for reading, searching, navigating, and opening wiki/raw/schema content. Keep capture/upload/source/maintenance actions in Ingest.
- Verification steps: `/private/llm-wiki?view=wiki` must not show Voice Capture, New Page, Add Source, QSource, Maintenance / Run Lint, Private Workspace, or an ingest sidebar.
- Related files/commands: `app/private/llm-wiki/page.tsx`, `projects/llm-wiki/LlmWikiWorkspace.tsx`, `projects/llm-wiki/LlmWikiIngestWorkspace.tsx`, `rg -n "Voice Capture|New Page|Add Source|QSource|Private Workspace|Run Lint" projects/llm-wiki`.

### LLMWIKI-DARK-MODAL-TEXT

- ID: `LLMWIKI-DARK-MODAL-TEXT`
- Problem pattern: Modal/page preview text becomes black on dark background and unreadable.
- Symptoms: Wiki/raw/schema page text is only readable when selected; close/actions or edit fields are visually unclear.
- Root cause: Modal, markdown preview, or edit controls rely on inherited/default browser colors instead of explicit dark-theme foreground/background classes.
- Correct fix: Explicitly set dark-theme foreground/background classes for markdown preview, headings, paragraphs, lists, code blocks, links, metadata, buttons, textarea, and edit mode.
- Verification steps: Open wiki, raw, and schema entries and confirm text is readable without selecting in read mode and edit mode.
- Related files/commands: `projects/llm-wiki/LlmWikiWorkspace.tsx`, `MarkdownPreview`, `SelectedEntryDialog`, `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `npm.cmd run build` when UI/routing changed.

### LLMWIKI-JSON-OUTPUT-PRIVACY

- ID: `LLMWIKI-JSON-OUTPUT-PRIVACY`
- Problem pattern: Direct LLM Wiki CLI JSON can include private runtime metadata such as local filenames, titles, or inbox item details.
- Symptoms: A dry-run or processing command is useful for debugging, but its raw output is not safe to paste into reports.
- Root cause: Low-level processing scripts are designed for local operation and diagnostics, not sanitized user-facing summaries.
- Correct fix: Prefer wrapper summaries when possible, or parse/summarize only counts, statuses, and error classes. Never paste item arrays or `.local-data` paths/content into the final report.
- Verification steps: Final reports contain aggregate counts and behavior only, with no private source filenames, titles, local data paths, env values, or source text.
- Related files/commands: `scripts/llm-wiki-process-local.mjs`, `scripts/llm-wiki-ingest-all.mjs`, `npm.cmd run llm-wiki:ingest-all -- --json`, `npm.cmd run llm-wiki:process -- --dry-run --json`.
