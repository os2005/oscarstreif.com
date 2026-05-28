# LLM Wiki Architecture

## Goal

The LLM Wiki is a private Second-Brain system for collecting uploads, speech captures, notes, and files from the website without immediately publishing or automatically processing them.

The website is the capture surface. The local filesystem is the private data layer. Codex is used later, on the local machine, to run a deliberate processing step that reads pending inbox items, transcribes or normalizes them, preserves source material, and updates the maintained Markdown wiki.

The primary source of truth is:

```text
.local-data/llm-wiki/wiki
```

Obsidian is an optional local mirror and viewer for this Markdown knowledge base. It is not the technical backend.

## Data Flow

The intended flow is:

```text
Website upload or speech capture
  -> .local-data/llm-wiki/inbox/pending
  -> local evening processing with Codex
  -> .local-data/llm-wiki/raw
  -> .local-data/llm-wiki/wiki
  -> optional one-way mirror to local Obsidian vault
  -> optional explicitly approved website output
```

Uploads and voice files should remain in the inbox until a local processing step is intentionally run. Processing is not expected to happen automatically just because a file was uploaded.

## Folder Roles

`.local-data/llm-wiki` is the private technical data root for the system.

`.local-data/llm-wiki/inbox/pending` stores newly submitted text, file, and speech uploads awaiting local processing.

`.local-data/llm-wiki/inbox/processing` may be used by processing scripts while work is in progress.

`.local-data/llm-wiki/inbox/processed` stores inbox metadata or source references after successful processing.

`.local-data/llm-wiki/inbox/failed` stores items that could not be processed safely.

`.local-data/llm-wiki/raw` stores immutable source material. Files in this folder are the evidence layer and should not be edited during wiki maintenance.

`.local-data/llm-wiki/wiki` stores the AI-maintained Markdown knowledge base. This includes source notes, topics, entities, decisions, questions, project notes, and maintenance reports.

`.local-data/llm-wiki/schema.md` defines operating rules for the wiki itself, including page conventions and maintenance workflows.

The website repository stores only code, UI, Server Actions, scripts, deployment files, and documentation.

## Never Commit

The following must never be committed:

- `.local-data/`
- private uploads
- voice files
- raw source files from private captures
- auth data
- session stores
- private AI-generated wiki content
- API keys
- tokens
- passwords
- `.env` files and environment-specific secret configuration

The repository may contain code that knows how to read or write the private data root, but it must not contain the private runtime data itself.

## Local Processing With Codex

The evening processing step should run locally when the PC is available. It should be explicit, inspectable, and safe to stop.

The local processor should:

1. Read pending inbox metadata and source files.
2. Transcribe speech files when needed.
3. Normalize text and file captures into durable source records.
4. Move or copy immutable source material into `raw`.
5. Create or update source pages in `wiki/sources`.
6. Update related topic, entity, project, question, decision, and open-loop pages.
7. Update `wiki/index.md` and `wiki/log.md`.
8. Leave failed or ambiguous items in a reviewable state.

Codex should treat `raw` as immutable evidence and `wiki` as the maintained synthesis layer.

## VPS Role

The VPS hosts the website and can accept uploads into its configured runtime data directory. The VPS should not be treated as the canonical long-term Second-Brain authoring environment unless that is explicitly decided later.

The VPS may hold temporary private runtime data required for the website to function, but private data should remain outside Git. Any transfer from VPS inbox data to the local machine must preserve privacy and avoid exposing raw uploads or generated private wiki content in the repository.

## Obsidian Role

Obsidian is a local reading, browsing, and backup surface for the AI-maintained Markdown wiki. It is not the backend, database, ingestion engine, or canonical editing surface.

The canonical private wiki remains:

```text
.local-data/llm-wiki/wiki
```

An optional local mirror may exist at a path such as:

```text
C:\Users\ostre\Documents\Obsidian\LLM-Wiki-Mirror
```

This mirror is useful for graph browsing, backlinks, search, and human review.

## One-Way Obsidian Mirror

The initial mirror direction is one-way only:

```text
.local-data/llm-wiki/wiki -> Obsidian vault
```

Changes made inside the Obsidian mirror must not be automatically written back into `.local-data/llm-wiki/wiki`.

If back-sync is ever introduced, it needs a separate design with conflict handling, review steps, and clear ownership rules. Until then, the Obsidian mirror should be considered disposable and regenerable from the canonical wiki folder.

## Public Website Output

The website must not automatically publish everything from `raw` or `wiki`.

Future public or semi-public website output should use an explicit allowlist, export flag, review queue, or publishing layer. Private captures, raw files, transcripts, and internal wiki pages remain private by default.

Safe future output may include:

- explicitly selected pages
- manually reviewed summaries
- public project notes
- redacted knowledge articles
- generated pages with clear publication metadata

The default rule is private until explicitly approved.

## Security Rules

- Do not commit `.local-data`.
- Do not commit uploads, voice files, transcripts, auth stores, sessions, or private wiki content.
- Do not print secrets in logs, documentation, issue text, or command output.
- Do not rely on Obsidian as the source of truth.
- Do not auto-publish from `raw` or `wiki`.
- Do not automatically process uploads at submission time.
- Keep local processing deliberate and reviewable.
- Preserve raw source material unchanged.
- Keep generated wiki changes traceable through `wiki/log.md`.
- Treat VPS runtime data as private operational data, not repository content.
