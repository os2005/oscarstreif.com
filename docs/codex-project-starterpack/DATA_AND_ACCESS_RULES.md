# Data And Access Rules

## Access Rules

The current platform access model is:

- `open`
  - public
- `shared`
  - admin can access
  - shared user can access only when their user id is in `project.sharedWithUserIds`
- `private`
  - admin only

Access is enforced server-side through:

- `lib/project-access.ts`
- `app/shared/[slug]/page.tsx`

Do not move access logic into client-only code.

## Shared Area

The protected Shared Area at `/shared` should only show projects relevant to the logged-in shared user.

The direct project route `/shared/[slug]` must enforce the same policy server-side.

## Platform-Level Data

Current platform-level JSON stores:

- auth store
  - users
  - sessions
  - invitations
- project store
  - project metadata
  - shared-user assignments
  - redirect configuration

These stores are owned by the platform and should not become dumping grounds for project-specific business data.

## Project-Specific Data

Project-specific business data should stay isolated.

Current recommended pattern:

- `projects/[slug]/data/store.ts`
or
- `data/projects/[slug]/store.json`

Keep it scoped by slug so unrelated projects do not interfere with each other.

## Future Database Naming

If the platform later moves to a database, project-specific tables should stay namespaced, for example:

- `project_[slug]_entries`
- `project_[slug]_settings`
- `project_[slug]_events`

Examples:

- `project_coldlog_measurements`
- `project_startup_dashboard_events`

## Redirect Rules

- `externalRedirectUrl` belongs to the JSON project record, not the project module
- `Visit` should always route to `/shared/[slug]`
- `/shared/[slug]` decides whether to redirect or render internally
- unsafe redirect protocols are not allowed
