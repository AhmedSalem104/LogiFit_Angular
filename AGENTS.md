# LogicFit Angular Execution Rules

## Documentation is part of the feature

Documentation is synchronized across `LogicFit` (Backend), `LogiFit_Angular` (Tenant UI), and
`LogiFit_Platform_Admin_Dashboard` (Platform UI). A cross-repository feature is incomplete until
every affected repository records the matching API contract, user flow, screen behavior,
permissions, architecture, and operational impact in the same task. If one repository is not
affected, its Pull Request impact list must say `No documentation impact` and give the reason.
Always distinguish local work, an open PR, merge to `develop`, release, deployment, and
production verification; never describe one state as another.

- Update `docs/PROJECT_REFERENCE.md` for architecture, services, routes, auth, or model changes.
- Update `docs/WORKSPACE-FLOWS.md` when a user flow, screen, role, or permission changes.
- Update `docs/SCREEN-OPERATIONS-GUIDE.md` for every screen change: purpose, visible data, controls, permissions, error/empty/loading states, and business limits.
- Update `docs/RESPONSIVE-DESIGN.md` when shared layout, sidebar, dialog, table, breakpoints, Tailwind, or PrimeNG conventions change.
- Refresh `docs/API-ENDPOINT-CATALOG.md` from the backend whenever an API contract changes. The backend generator is `..\LogicFit\Scripts\Export-ApiEndpointCatalog.ps1`.
- For authentication, identity, OTP, session, invitation, join, workspace-selection, or access-gate changes, update this repository's `PROJECT_REFERENCE`, `WORKSPACE-FLOWS`, screen catalog/operations guide, the Backend canonical auth flow, and the Platform documentation when that surface is affected.
- List the documentation impact for all three repositories in every cross-repository Pull Request, including required merge and deployment order.
- Never put secrets, tokens, production credentials, or publish profiles in docs, commits, screenshots, or logs.
- After every modification, verify the affected server health before continuing: call the applicable
  `/health` endpoint and require HTTP 200 with the expected healthy response, never HTTP 500/503 or
  `Unhealthy`. For local-only UI changes, run the local health check when the API can be started and
  record the exact verification or environment blocker in the Issue; a build or test pass alone
  never proves server health.

## Responsive and security baseline

- Mobile starts with a closed navigation drawer. Desktop uses hover expansion and an explicit pin state.
- Preserve the shared table and dialog guardrails in `src/styles.scss`; do not add page-level fixed widths that cause viewport overflow.
- Every action remains permission-filtered in UI and enforced by the backend. Never trust tenant, role, or permission data from the browser as a security boundary.

## Verification

```powershell
npm run build
```

Review the owner workspace at 360px, 768px, 1024px, and 1440px after shared layout changes.
