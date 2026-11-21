# Security

This document describes the security model of the codebase. To report a vulnerability, contact the maintainers privately. Don't open a public issue that contains exploit details.

## Content and secret boundaries

- The repository holds code and CMS schemas only. Owner content lives in PostgreSQL and media storage.
- Secrets are supplied through the runtime environment and validated at startup (`src/lib/env.ts`). Validation errors name the variable but never print its value.
- `.gitignore` covers `.env*` (except `.env.example`), uploads (`/media`), database dumps and Playwright artefacts.
- CI runs gitleaks over the full Git history and uses placeholder credentials only.

## Access control

| Concern          | Control                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Drafts           | The collection `read` rule limits anonymous readers to `_status = published`. Version history requires login       |
| Public rendering | Queries use `overrideAccess: false` with no user, plus `draft: false`, an explicit `select` and view-model mapping |
| Users            | No public sign-up. Admin-only create and delete. Role changes are admin-only at field level                        |
| First account    | Payload's first-user screen only works while no users exist, and that account is forced to `admin`                 |
| Admin panel      | Requires authentication. Optionally also restrict it at the proxy (see `deployment.md`)                            |
| APIs             | GraphQL is disabled. The REST API is enforced by the same collection access rules                                  |

The Payload Local API bypasses access control by default. Any new public data access must pass `overrideAccess: false`, and the integration tests in `tests/int/` should cover it.

## Input and output safety

- **Links:** navigation `href` values are validated when saved and checked again at render time. Rich-text links render only when they are safe external URLs; anything else (`javascript:`, `data:`, protocol-relative, internal document links) is shown as plain text.
- **Uploads:** only raster images (JPEG, PNG, WebP, AVIF, GIF) up to 10 MB are accepted, and SVG is rejected. Uploads require an authenticated editor.
- **Media visibility:** uploaded files can be fetched by anyone who has the URL, even if they're only attached to a draft. Don't upload confidential material. A gated media route is planned.
- **Database:** all queries go through Payload and Drizzle with parameters. No raw SQL is built by joining strings.

## HTTP hardening

Every response gets these headers (configured in `next.config.ts`):

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'`
- `Permissions-Policy` turning off the camera, microphone, geolocation and topics
- `Strict-Transport-Security` (production only)
- No `X-Powered-By` header

A full Content Security Policy is planned once the WebGL and Ghost image sources are known, so it can be strict without breaking the Payload admin.

## Dependencies

- `pnpm audit --audit-level high` runs in CI. Transitive security fixes are pinned under `overrides` in `pnpm-workspace.yaml`, each with a note on when to remove it.
- pnpm's minimum-release-age gate is enabled. Exceptions are listed under `minimumReleaseAgeExclude` and should be removed once those versions are old enough to pass the gate.
- Build scripts are allowed only for packages that need them (`allowBuilds`).

## Known gaps

- No authenticated draft preview yet. Drafts are only visible inside `/admin`.
- No rate limiting inside the app. Add it at the proxy for `/api/users/login`.
- No email adapter. Password-reset emails are written to the server console, so configure an adapter before relying on password resets.
