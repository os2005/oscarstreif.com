# Codex Project Starterpack

This starterpack is the developer onboarding package for building future project modules inside `oscarstreif.com`.

Use it at the beginning of every new Codex project session that should integrate into the existing platform.

What matters in this codebase:

- JSON project record = runtime configuration
- project module = code-level implementation
- canonical project delivery route = `/shared/[slug]`
- visibility model = `open`, `shared`, `private`

The runtime project record lives in the existing project store and controls:

- title
- slug
- description
- visibility
- status
- `externalRedirectUrl`
- `sharedWithUserIds`
- tags

The project module lives under `projects/[slug]/` and controls the standalone rendered project website delivered through `/shared/[slug]`.

Important:

- New work must integrate into the current platform.
- Do not build a separate standalone app inside the repo.
- Do not bypass `/shared/[slug]`.
- Do not expose a module without a matching JSON project record.
- Do not wrap project modules in the oscarstreif.com header, navigation, PageShell, ProjectShowcase or grain overlay.
- The only visible platform UI on an internally rendered project page should be the injected project exit button.

Recommended order for future Codex sessions:

1. Read this starterpack
2. Inspect the current platform files it references
3. Fill out `PROJECT_BRIEF_TEMPLATE.md`
4. Use `MASTER_PROMPT_FOR_NEW_PROJECT.md`
5. After implementation, use `REVIEW_PROMPT_FOR_NEW_PROJECT.md`
