# Project Platform

This codebase uses a two-layer project platform built into the existing Next.js app.

For future Codex project work, start with `docs/codex-project-starterpack/START_HERE.md`.

## 1. Runtime project record vs project module

There are two different pieces that work together by slug.

### Runtime project record

Managed through the Private Workspace and stored in JSON through:

- `lib/project-store.ts`
- `lib/projects.ts`

This record controls runtime configuration such as:

- `id`
- `title`
- `slug`
- `description`
- `visibility`
- `externalRedirectUrl`
- `sharedWithUserIds`
- `tags`
- `status`
- timestamps

### Project module

Stored in code under `projects/<slug>/`.

This module controls the internal rendered project experience, for example:

- custom shared page UI
- optional future project-specific admin panel
- optional future server/data adapters
- module documentation
- project data namespace guidance

The current type lives in:

- `lib/project-modules/types.ts`

The registry lives in:

- `lib/project-modules/registry.ts`

## 2. Route resolution

`/shared/[slug]` is the canonical project delivery route.

Resolution order:

1. Load the JSON project record from `lib/projects.ts`
2. Enforce access server-side with `lib/project-access.ts`
3. If `externalRedirectUrl` exists, render `components/ProjectRedirectScreen.tsx`
4. Else resolve a registered project module by slug
5. If a module exists, render its `SharedPage`
6. Else render the generic fallback `components/ProjectShowcase.tsx`

Important:

- A project module alone is not public.
- A JSON project record must exist and be active.
- Access is controlled by the runtime project record, not by the module itself.

## 3. Access control

Access rules are enforced server-side in `lib/project-access.ts`.

- `open`: public
- `shared`: admins plus assigned shared users only
- `private`: admins only

`/shared` filters visible projects for the logged-in user.
`/shared/[slug]` enforces the same rules directly, so direct URLs cannot bypass assignment checks.

## 4. External redirects

All project visits should go through `/shared/[slug]`.

If `externalRedirectUrl` is set:

- `/shared/[slug]` renders `components/ProjectRedirectScreen.tsx`
- the page performs the branded redirect
- only `http` and `https` URLs are accepted
- values like `example.com` are normalized to `https://example.com`

If no external redirect exists:

- the project renders internally through a module or the generic showcase fallback

## 5. How to add a new internal project module

1. Copy `projects/_template/` to `projects/<slug>/`
2. Implement `SharedPage.tsx`
3. Update `module.ts`
4. Register the module in `lib/project-modules/registry.ts`
5. Create the matching project record in the Private Workspace
6. Set visibility, status and shared access in the Private Workspace

## 6. Frontend-only project example

Minimal module:

```ts
import { MyToolSharedPage } from "./SharedPage";
import type { ProjectModuleDefinition } from "@/lib/project-modules/types";

export const myToolProjectModule: ProjectModuleDefinition = {
  slug: "my-tool",
  title: "My Tool",
  SharedPage: MyToolSharedPage,
};
```

## 7. Project with custom admin panel

If a project later needs project-specific admin controls, add:

- `AdminPanel.tsx`

and expose it from the module definition.

Important:

- `AdminPanel` is part of the extension contract, but it is not currently rendered inside the Private Workspace.
- The shared platform fields should stay in the main project record. Project-specific controls should only handle module-specific behavior once that extension point is wired live.

## 8. Project-specific data isolation

Do not put project-specific business data into the central project metadata object.

Current JSON-based convention:

- `data/projects/<slug>/store.json`
or
- `projects/<slug>/data/store.ts`

Keep data namespaced by slug so projects cannot interfere with each other.

## 9. Future database migration path

When this platform moves to a real database, keep this split:

Platform tables:

- `users`
- `sessions`
- `invitations`
- `projects`
- `project_access`

Project-specific tables:

- `project_coldlog_measurements`
- `project_startup_dashboard_events`
- `project_my_tool_settings`

The current module boundary is designed so that JSON persistence can later be replaced without changing project route structure.

## 10. Future Codex prompt guidance

When adding a new project with Codex, the prompt should explicitly say:

- use the existing project-module contract
- register the module in the central registry
- keep runtime config in the JSON project record
- do not create parallel project routing or duplicate CRUD logic
- keep `/shared/[slug]` as the canonical route
- isolate project-specific data by slug
