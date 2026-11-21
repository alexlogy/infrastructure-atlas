# Security

This document describes the security model of the codebase. To report a vulnerability, contact the maintainers privately. Don't open a public issue that contains exploit details.

## Content and secret boundaries

- The repository holds code and CMS schemas only. Owner content lives in PostgreSQL and media storage.
- Secrets are supplied through the runtime environment and validated at startup (`src/lib/env.ts`). Validation errors name the variable but never print its value.
- `.gitignore` covers `.env*` (except `.env.example`), uploads (`/media`), database dumps and Playwright artefacts.
- CI runs gitleaks over the full Git history and uses placeholder credentials only.

## Access control

| Concern          | Control                                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drafts           | The collection `read` rule limits anonymous readers to `_status = published`. Version history requires login                                                                                                                     |
| Public rendering | Queries use `overrideAccess: false` with no user, plus `draft: false`, an explicit `select` and view-model mapping                                                                                                               |
| Draft preview    | `/api/preview` needs a valid Payload session and only redirects to same-site paths. Pages re-check the session on every render; with an editor they read drafts as that user (`overrideAccess: false`) and skip the shared cache |
| Login            | 5 failed attempts lock the account for 10 minutes. The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when the site URL is https                                                                                     |
| Users            | No public sign-up. Admin-only create and delete. Role changes are admin-only at field level                                                                                                                                      |
| First account    | Payload's first-user screen only works while no users exist, and that account is forced to `admin`                                                                                                                               |
| Admin panel      | Requires authentication. Optionally also restrict it at the proxy (see `deployment.md`)                                                                                                                                          |
| APIs             | GraphQL is disabled. The REST API is enforced by the same collection access rules                                                                                                                                                |

The Payload Local API bypasses access control by default. Any new public data access must pass `overrideAccess: false`, and the integration tests in `tests/int/` should cover it.

## Input and output safety

- **Links:** navigation `href` values are validated when saved and checked again at render time. Rich-text links render only when they are safe external URLs; anything else (`javascript:`, `data:`, protocol-relative, internal document links) is shown as plain text.
- **Uploads:** only raster images (JPEG, PNG, WebP, AVIF, GIF) up to 10 MB are accepted, and SVG is rejected. Uploads require an authenticated editor.
- **Media visibility:** uploaded files can be fetched by anyone who has the URL, even if they're only attached to a draft. Don't upload confidential material. A gated media route is planned.
- **Ghost:** only the read-only Content API key is used, server-side. Request URLs carry the key, so they are never logged or used as cache keys. Post URLs and images must be http(s), and cards link to the canonical article rather than copying it.
- **Ghost webhook:** `/api/revalidate/ghost` returns 404 unless `REVALIDATION_SECRET` (at least 32 characters) is set. Each delivery needs a valid `X-Ghost-Signature`, compared in constant time, with a timestamp within 5 minutes to limit replays. Bodies over 5 MB are refused, and the payload is never parsed or logged. The only effect is expiring the cached post list, so a replay inside the window costs one extra Ghost fetch.
- **Database:** all queries go through Payload and Drizzle with parameters. No raw SQL is built by joining strings.

## HTTP hardening

Every response gets these headers (configured in `next.config.ts`):

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'`
- `Permissions-Policy` turning off the camera, microphone, geolocation and topics
- `Strict-Transport-Security` (production only)
- No `X-Powered-By` header

### Content Security Policy

Every rendered page, public or `/admin`, gets a per-request nonce policy from `src/proxy.ts` (built by `src/lib/csp.ts`):

| Directive                                                     | Value                                                           | Why                                                                                                                                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `script-src`                                                  | `'self' 'nonce-…' 'strict-dynamic'`                             | Only scripts Next.js rendered with this request's nonce, and what they load, can run. No `'unsafe-inline'`; `'unsafe-eval'` only in development, where React's tooling needs it |
| `style-src`                                                   | `'self' 'unsafe-inline'`                                        | Trade-off: next/image, the WebGL canvas and Payload admin widgets set inline style attributes that a nonce cannot cover. Injected CSS cannot run code                           |
| `img-src`                                                     | `'self' data: blob:`, the `GHOST_URL` origin, `CSP_IMG_ORIGINS` | Only listed origins, validated to http(s); never a blanket `https:`                                                                                                             |
| `connect-src`                                                 | `'self'` (plus `ws:` in development for hot reload)             | Ghost is fetched on the server, so the browser needs no other origins                                                                                                           |
| `object-src` / `base-uri` / `form-action` / `frame-ancestors` | `'none'` / `'self'` / `'self'` / `'self'`                       | No plugins, no base-tag hijacking, forms post only here, framing only by this site                                                                                              |
| `upgrade-insecure-requests`                                   | when `NEXT_PUBLIC_SITE_URL` is https                            |                                                                                                                                                                                 |

The e2e suite browses every public page, the admin dashboard and the milestone editor, and fails on any `securitypolicyviolation`. It has passed against both the dev server and a production build. The admin's avatar is Payload's built-in one, because Gravatar would send a hash of each editor's email to a third party.

If Ghost serves feature images from another host (a CDN or image service), add that origin to `CSP_IMG_ORIGINS`. Otherwise those images are blocked and the cards show without them.

## Dependencies

- `pnpm audit --audit-level high` runs in CI. Transitive security fixes are pinned under `overrides` in `pnpm-workspace.yaml`, each with a note on when to remove it.
- pnpm's minimum-release-age gate is enabled. Exceptions are listed under `minimumReleaseAgeExclude` and should be removed once those versions are old enough to pass the gate.
- Build scripts are allowed only for packages that need them (`allowBuilds`).

## Known gaps

- No per-IP rate limiting inside the app. Accounts lock for 10 minutes after 5 failed logins, but add per-IP limits at the reverse proxy (see `deployment.md`), which also stops attackers from keeping an editor locked out.
- No email adapter. Password-reset emails are written to the server console, so configure an adapter before relying on password resets.
