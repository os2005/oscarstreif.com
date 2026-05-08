# Module Structure Template

This is the preferred structure for a new project module in the current live architecture.

## Required Structure

```text
projects/[project-slug]/
  module.ts
  SharedPage.tsx
```

Required files:

- `module.ts`
- `SharedPage.tsx`

## Optional Structure

```text
projects/[project-slug]/
  module.ts
  SharedPage.tsx
  README.md
  components/
    ExampleComponent.tsx
  data/
    store.ts
  server/
    actions.ts
  admin/
    AdminPanel.tsx
```

Optional files:

- `README.md` for project-specific notes
- `components/` for module-local UI
- `data/` for project-specific JSON store helpers
- `server/` for project-specific server logic
- `admin/AdminPanel.tsx` as a future-facing extension point

Important:

- `AdminPanel` is part of the contract, but it is not currently rendered by the live Private Workspace.
- Do not put project-specific logic into `lib/projects.ts` unless it is truly shared platform logic.
- Do not put one-off project UI into `components/ProjectManagement.tsx`.

## What `module.ts` should export

`module.ts` should export a typed `ProjectModuleDefinition` using the current contract from `lib/project-modules/types.ts`.

Typical fields:

- `slug`
- `title`
- `defaultDescription`
- `documentationPath`
- `dataNamespace`
- `requiredFeatures`
- `moduleStatus`
- `SharedPage`

## What `SharedPage.tsx` should do

`SharedPage.tsx` receives:

- `backHref`
- `backLabel`
- `isDark`
- `pathLabel`
- `project`
- `viewer`

It should render the internal project experience for `/shared/[slug]`.

It should not:

- bypass access rules
- fetch unrelated platform data
- assume it is public unless the platform already allowed access
- replace the platform redirect logic

## Registration

Every live module must be explicitly imported and registered in:

- `lib/project-modules/registry.ts`

Do not use dynamic imports from user input.

## Minimal Example

```ts
import { ExampleSharedPage } from "./SharedPage";
import type { ProjectModuleDefinition } from "@/lib/project-modules/types";

export const exampleProjectModule: ProjectModuleDefinition = {
  slug: "example-project",
  title: "Example Project",
  defaultDescription: "Short internal project description.",
  documentationPath: "projects/example-project/README.md",
  dataNamespace: "example-project",
  requiredFeatures: ["shared-route"],
  moduleStatus: "draft",
  SharedPage: ExampleSharedPage,
};
```

```tsx
import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";

export function ExampleSharedPage({ project }: ProjectModuleSharedPageProps) {
  return <section>{project.title}</section>;
}
```

Do not register this example as a live project unless you are intentionally creating a real module and a matching JSON project record.
