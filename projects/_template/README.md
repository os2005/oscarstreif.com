# Project Module Template

Copy this folder to `projects/<your-slug>/` when you add a new internal project module.

Minimum setup:

- `module.ts`
- `SharedPage.tsx`

Optional setup:

- `AdminPanel.tsx`
- `server/`
- `data/`
- `README.md`

Rules:

- The project must also exist in the JSON project store through the Private Workspace.
- The JSON project record controls visibility, shared-user access, redirects and runtime metadata.
- The project module controls the internal rendered experience for `/shared/[slug]`.
- `AdminPanel.tsx` is future-facing for now and is not yet rendered in the live Private Workspace.
- Register the module explicitly in `lib/project-modules/registry.ts`.
- Keep project-specific data namespaced by slug, for example `data/projects/<slug>/store.json`.
