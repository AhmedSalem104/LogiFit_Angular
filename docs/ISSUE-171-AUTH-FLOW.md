# Issue #171 — Tenant identity flow

Status: local branch `feature/171-tenant-frontend`; not merged, deployed, or production-verified.

## Current contract

- Identity login is Email + Password only (`POST /api/identity/login`).
- Phone is optional contact data during registration; Phone Login is not rendered or called.
- OTP, Passkey, and WebAuthn controls and browser calls were removed from the tenant UI.
- Email confirmation and password recovery remain single-use link flows.
- The server supplies active workspaces and pending applications together. The UI never selects a
  role or invents a membership.
- Invitation and client-join screens authenticate the identity first, then submit only the
  server-bound token and workspace-selection token.
- Error responses are rendered inline and no credential, token, or OTP is stored by the UI.

## Compatibility and release

This PR changes the frontend consumer contract only. Backend OTP/legacy routes are owned by the
backend auth-consolidation issue and are not removed by this change. The new UI must be deployed
with the matching backend identity contract before it is enabled in production.

## Documentation impact

Tenant repository: this document and the existing project/workspace/screen references are affected.
Backend repository: no documentation impact from this frontend-only branch; no backend route,
schema, permission, or deployment behavior was changed.
Platform Dashboard repository: no documentation impact; its screens are not changed by this PR.
