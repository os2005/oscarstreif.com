# Implementation Checklist

## Before Coding

- Read `docs/codex-project-starterpack/START_HERE.md`
- Read the rest of the starterpack
- Inspect the current registry, module contract, route logic, and project store
- Confirm the project slug and visibility

## During Implementation

- Create `projects/[slug]/`
- Create `projects/[slug]/module.ts`
- Create `projects/[slug]/SharedPage.tsx`
- Add optional `components/`, `data/`, `server/`, or `README.md` only if needed
- Register the module explicitly in `lib/project-modules/registry.ts`
- Keep `/shared/[slug]` as the canonical route
- Keep runtime config in the JSON project record system
- Do not expose the module without a matching JSON project record
- Keep project-specific data isolated
- Do not touch auth, access, routing, or the Private Workspace unless the work truly requires it

## Verification

- Check that a matching JSON project record exists or clearly state that it must be created in the Private Workspace
- Check that the module only renders when the platform route resolves it
- Check that external redirect still wins over module rendering
- Check that a project without a module still falls back to `ProjectShowcase`
- Check that access behavior still respects `open`, `shared`, and `private`
- Check mobile layout
- Run available checks from `package.json`

## Definition Of Done

- The project is implemented under `projects/[slug]/`
- The module is registered explicitly
- No parallel project platform was created
- No standalone auth or routing was introduced
- Project-specific data is isolated
- Build and lint pass
- Changed files are clearly reported
