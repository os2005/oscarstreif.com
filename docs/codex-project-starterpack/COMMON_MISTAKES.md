# Common Mistakes

Future Codex sessions should avoid all of the following:

- Do not create a standalone Next.js app inside this repo.
- Do not create a second auth system.
- Do not create a second project registry or parallel platform.
- Do not bypass `/shared/[slug]`.
- Do not point `Visit` directly at an external URL.
- Do not expose a module without a matching JSON project record.
- Do not add Prisma, Drizzle, Supabase, or a database layer unless explicitly requested.
- Do not put project-specific business logic into `lib/projects.ts`.
- Do not pollute `components/ProjectManagement.tsx` with one-off project code.
- Do not hardcode one project into platform-level routing logic.
- Do not trust client-side checks for project access.
- Do not store all project-specific data in the central project metadata object.
- Do not weaken the `open` / `shared` / `private` visibility model.
- Do not break the existing Shared Area or Private Workspace unless the task explicitly requires it.
- Do not break placeholder pages like `/mi/mi`, `/cv`, `/CV`, or `/me`.
- Do not assume `AdminPanel` is live unless the platform explicitly renders it.
