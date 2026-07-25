# LogicFit Angular Execution Rules

## Documentation is part of the feature

- Update `docs/PROJECT_REFERENCE.md` for architecture, services, routes, auth, or model changes.
- Update `docs/WORKSPACE-FLOWS.md` when a user flow, screen, role, or permission changes.
- Update `docs/SCREEN-OPERATIONS-GUIDE.md` for every screen change: purpose, visible data, controls, permissions, error/empty/loading states, and business limits.
- Update `docs/RESPONSIVE-DESIGN.md` when shared layout, sidebar, dialog, table, breakpoints, Tailwind, or PrimeNG conventions change.
- Refresh `docs/API-ENDPOINT-CATALOG.md` from the backend whenever an API contract changes. The backend generator is `..\LogicFit\Scripts\Export-ApiEndpointCatalog.ps1`.
- Never put secrets, tokens, production credentials, or publish profiles in docs, commits, screenshots, or logs.

## Responsive and security baseline

- Mobile starts with a closed navigation drawer. Desktop uses hover expansion and an explicit pin state.
- Preserve the shared table and dialog guardrails in `src/styles.scss`; do not add page-level fixed widths that cause viewport overflow.
- Every action remains permission-filtered in UI and enforced by the backend. Never trust tenant, role, or permission data from the browser as a security boundary.

## Verification

```powershell
npm run build
```

Review the owner workspace at 360px, 768px, 1024px, and 1440px after shared layout changes.
