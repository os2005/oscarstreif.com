# WG Project Dashboard

This module provides a standalone app-like WG operations dashboard hosted inside the existing `oscarstreif.com` platform.

It uses the platform for:

- login and session handling
- server-side project access control
- runtime project record visibility
- hosting and deployment
- JSON-based persistence patterns

It does not introduce a second app, a second auth system, or WG-specific platform-core hardcoding.

## Routes

- `/shared/wg-project-dashboard`
  Canonical project-record-controlled delivery route. The existing `/shared/[slug]` platform route enforces access first, then renders this module as a standalone project website and injects the project exit button.
- `/wgprojectdashboard`
  Legacy convenience route. It redirects to `/shared/wg-project-dashboard`.
- `/apps/wg-project-dashboard`
  Legacy internal app route. It redirects to `/shared/wg-project-dashboard`.

## Required Runtime Project Record

Create the runtime project record through the existing Private Workspace flow if it does not already exist.

Required values:

- `title`: `WG Project Dashboard`
- `slug`: `wg-project-dashboard`
- `visibility` during development: `private`
- later release visibility: `shared`
- `status`: `active`
- `sharedWithUserIds`: `[]` while private development is in progress
- `externalRedirectUrl`: empty / not set
- `description`: `A private dashboard for planning, funding, and tracking WG projects.`
- `tags`: `private`, `wg`, `dashboard`, `planning`

Notes:

- The runtime project record must be `active` if the admin should be able to open the project.
- To release later, switch `visibility` from `private` to `shared` and assign the intended shared users through the existing shared-user assignment flow.
- Do not reintroduce WG-specific hardcoding into `lib/project-store.ts`.

## Data Storage

WG business data is isolated by slug:

- persisted JSON: `data/projects/wg-project-dashboard/store.json`
- helper/accessor code: `projects/wg-project-dashboard/data/store.ts`

Platform-level project metadata should remain in the central runtime project store. WG business data should not be moved there.

## Access Control

- `/shared/wg-project-dashboard` enforces server-side project access before WG business data is loaded.
- WG data must not be loaded before access is allowed.
- Client-only authorization is not sufficient.

Release flow:

- During development, keep the runtime project record `private` and `active` so only the admin can open the app.
- To release later, switch `visibility` from `private` to `shared`.
- Then assign the intended shared users through the existing shared-user assignment mechanism.
- Unassigned shared users should remain denied.

## Seed Behavior

- Missing WG store file: create the store with the default WG sample projects.
- Corrupt or unreadable WG store file: recover safely with a fresh initialized store.
- Existing valid store with projects: preserve the projects.
- Existing valid store with `projects: []`: keep the empty list and do not reseed demo data.
