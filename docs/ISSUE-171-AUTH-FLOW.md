# Issue #171 — Tenant identity flow

Status: merged to `main` as PR #58; deployment and Production verification remain operator steps.

## Current contract

- Identity login is Email + Password only (`POST /api/identity/login`).
- Phone is optional contact data during registration; Phone Login is not rendered or called.
- OTP, Passkey, and WebAuthn controls and browser calls were removed from the tenant UI.
- Email confirmation and password recovery remain single-use link flows.
- The server supplies active workspaces and pending applications together. One active workspace or
  one pending application is routed automatically; an explicit compact choice remains only for an
  ambiguous response. The UI never selects a role or invents a membership.
- Invitation and client-join screens authenticate the identity first, then submit only the
  server-bound token and workspace-selection token.
- Error responses are rendered inline and no credential, access token, refresh token, or email
  action token is stored by the UI.

## Compatibility and release

The UI consumes the Backend Email + Password identity contract. Legacy `/api/auth/login` and
`/api/auth/register` routes, Phone Login, OTP, Passkey, and WebAuthn are not part of the active
contract. Deploy the Backend and Tenant UI together before enabling the flow in Production.

## Documentation impact

Tenant repository: this document and the existing project/workspace/screen references are affected.
Backend repository: the matching auth contract, endpoint catalog, and guarded OTP cleanup migration
are documented in the Backend repository.
Platform Dashboard repository: no documentation impact; its screens are not changed by this PR.
