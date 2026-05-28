# Master Prompt For New Project

Copy this prompt into a future Codex session and fill in the placeholders.

```text
You are working on the existing oscarstreif.com codebase.

Important:
- Read `docs/codex-project-starterpack/START_HERE.md` first.
- Then read the rest of `docs/codex-project-starterpack/`.
- Then inspect the current platform files before changing anything.

Core rule:
Build this as a standalone project website module inside the existing oscarstreif.com platform.
Do not create a parallel auth system, parallel project registry, separate routing layer, or nested Next.js app.

Project brief:
- Project name: {{PROJECT_NAME}}
- Project slug: {{PROJECT_SLUG}}
- Project description: {{PROJECT_DESCRIPTION}}
- Visibility: {{VISIBILITY}}
- Needs database or data store: {{NEEDS_DATABASE_OR_DATA_STORE}}
- Needs custom admin panel: {{NEEDS_CUSTOM_ADMIN_PANEL}}
- Needs external redirect: {{NEEDS_EXTERNAL_REDIRECT}}
- Special requirements: {{SPECIAL_REQUIREMENTS}}

Required working method:
1. Read the starterpack first.
2. Inspect the current platform files and architecture before editing.
3. Ask only essential clarifying questions if something is genuinely ambiguous or risky.
4. Build the project as a module under `projects/{{PROJECT_SLUG}}/`.
5. Register the module explicitly in the central registry.
6. Keep `/shared/[slug]` as the canonical project delivery route.
7. Keep runtime configuration in the existing JSON project record system.
8. Respect the existing visibility model:
   - `open`
   - `shared`
   - `private`
9. Respect existing access rules and do not weaken auth or route protection.
10. Avoid touching platform core files unless necessary for clean integration.
11. Do not add Prisma, Drizzle, Supabase, NextAuth, or a new database unless explicitly requested.
12. Keep project-specific data isolated from platform-level project metadata.
13. Run available checks from `package.json`.
14. Report changed files clearly at the end.

Inspect these existing files before implementation:
- `docs/project-platform.md`
- `projects/_template/README.md`
- `projects/_template/module.ts`
- `projects/_template/SharedPage.tsx`
- `lib/project-modules/types.ts`
- `lib/project-modules/registry.ts`
- `lib/project-modules/resolve-project-module.ts`
- `lib/project-types.ts`
- `lib/projects.ts`
- `lib/project-access.ts`
- `lib/project-redirect-url.ts`
- `app/shared/[slug]/page.tsx`
- `app/shared/page.tsx`
- `components/ProjectManagement.tsx`
- `components/PrivateAreaPanel.tsx`

Implementation expectations:
- Create `projects/{{PROJECT_SLUG}}/module.ts`
- Create `projects/{{PROJECT_SLUG}}/SharedPage.tsx`
- Make `SharedPage.tsx` own the full visible project website: header, layout, colors, typography and interactions.
- Do not use the oscarstreif.com Header, PageShell, ProjectShowcase, main navigation or grain overlay inside the project module.
- Add any project-specific subfolders only if needed:
  - `components/`
  - `data/`
  - `server/`
  - `README.md`
- Do not expose the module publicly unless a JSON project record exists and the route/access policy allows it.
- If `externalRedirectUrl` is configured in the JSON project record, `/shared/{{PROJECT_SLUG}}` must still follow the existing redirect path rather than rendering the module.
- Do not render a platform back link inside the module. The platform injects the project exit button on internally rendered project pages.

Output requirements:
- Explain the implementation approach briefly
- List changed files
- List any assumptions
- State which checks were run and their results
```
