# Review Prompt For New Project

Copy this into Codex after a new project module has been implemented.

```text
Please perform a focused review of the newly added project module in the existing oscarstreif.com codebase.

Important:
- Review this as an integration into the existing platform.
- Do not evaluate it like a standalone website.
- Do not redesign the platform.

Check:
1. Did the project integrate as a module under `projects/[slug]/`?
2. Did it avoid creating a parallel platform, auth system, or routing layer?
3. Is the module registered correctly in `lib/project-modules/registry.ts`?
4. Does `/shared/[slug]` remain the canonical route?
5. Does the project respect `open`, `shared`, and `private` access rules?
6. Can unauthorized users access project content or metadata by direct URL?
7. Does it avoid exposing a module without a JSON project record?
8. If `externalRedirectUrl` exists, does redirect still win over module rendering?
9. If no module exists, does the platform still fall back correctly?
10. Did the implementation avoid touching unrelated platform files?
11. Are project-specific data stores isolated by slug/module?
12. Are there mobile layout issues?
13. Are there security issues, access issues, or data leakage risks?
14. Do available checks pass?
15. What TODOs remain?

Please report:
- findings ordered by severity
- affected files
- integration risks
- recommended fixes
```
