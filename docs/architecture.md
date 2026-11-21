# Architecture

Infrastructure Atlas is one Next.js application with Payload CMS embedded in it. PostgreSQL runs as a separate service and holds all portfolio content. The repository contains code and CMS schemas only, never owner content.

```text
Visitor ──> Next.js server (Node.js runtime)
              ├── (frontend) routes: /, /journey ............ server components, plain HTML
              │      └── src/lib/payload/public.ts .......... cached, server-only queries
              │             └── src/lib/payload/queries.ts .. Payload Local API, published records only
              ├── (payload) routes: /admin, /api/* .......... Payload admin and REST API
              │      └── collection hooks ──> revalidateTag(...) on publish / unpublish / delete
              ├── /api/revalidate/ghost ..................... signed Ghost webhook, expires the `ghost` tag
              └── /api/health ............................... database readiness probe
                                   │
                                   └──> PostgreSQL (portfolio content), media storage (uploads)
```

## Module boundaries

| Path                               | Responsibility                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `src/collections/`, `src/globals/` | CMS schemas, validation, access rules and revalidation hooks                        |
| `src/access/`                      | Reusable access functions (`publishedOrAuthenticated`, `adminOrSelf`, ...)          |
| `src/lib/payload/queries.ts`       | Uncached public queries. Always `overrideAccess: false`, no user, explicit `select` |
| `src/lib/payload/public.ts`        | `server-only` cached wrappers (`unstable_cache` plus tags) used by pages            |
| `src/lib/payload/mappers.ts`       | CMS document → view model. Components receive view models, never raw documents      |
| `src/lib/cache/`                   | Cache tag names and `expireTag`, which is safe to call outside a Next request       |
| `src/lib/validation/`              | Pure validators shared by CMS fields and render-time checks (links, date ranges)    |
| `src/lib/env.ts`                   | zod validation of server configuration                                              |
| `src/components/`                  | Presentational React components, with no data fetching                              |
| `src/types/view-models.ts`         | The public data contract between data access and UI                                 |

## Data flow for a published milestone

1. An editor saves a milestone as a draft in `/admin`. Payload stores it as a version. The collection hook sees no published content involved, so it does nothing.
2. The editor publishes. The collection `afterChange` hook calls `revalidateTag('timeline', { expire: 0 })`.
3. The next request to `/journey` misses the cache. `fetchPublicTimeline` reads published records as an anonymous user, the mappers turn them into `MilestoneView` objects, and the page renders them as HTML.

Unpublishing and deleting published content expire the same tag. Saving site settings expires `site-settings`.

## Rendering and caching

- Frontend routes are dynamic (`force-dynamic`), so `next build` never needs a database. CMS reads are cached through `unstable_cache` and invalidated by tag.
- Next.js 16 `cacheComponents` is deliberately **not** enabled yet. Switching to `'use cache'` / `cacheTag` should be a single, deliberate migration.
- Client components are reserved for real interactivity. The only one today is the error boundary.

## Database schema lifecycle

| Environment | Schema changes                                                                        |
| ----------- | ------------------------------------------------------------------------------------- |
| Development | Payload pushes the schema automatically (`PAYLOAD_DB_PUSH=true`, the default)         |
| Tests / CI  | Committed migrations only. Push is off when `NODE_ENV=test` and in the Playwright run |
| Production  | Committed migrations only (`pnpm migrate`). Push is never enabled                     |

## Ghost writing

`src/lib/ghost/client.ts` is a framework-free Content API client, so it can be unit-tested with a mocked `fetch`. Each refresh makes two requests, one for featured slugs and one for recent posts. Both ask only for card fields (no article HTML) and time out after 5 seconds. Responses are validated with zod, and invalid posts, non-http(s) URLs and internal tags are dropped. `src/lib/ghost/index.ts` caches the result for 15 minutes with `unstable_cache` under the `ghost` tag. A failed refresh throws instead of being cached, and a per-process last-known-good copy covers outages. The e2e suite runs against `tests/e2e/mock-ghost.mjs`, so CI needs no Ghost account.

`POST /api/revalidate/ghost` lets Ghost expire the `ghost` tag as soon as a post changes. `src/lib/ghost/webhook.ts` checks Ghost's `X-Ghost-Signature` (HMAC-SHA256 of the raw body plus timestamp, keyed with `REVALIDATION_SECRET`) in constant time and rejects timestamps more than 5 minutes off. The payload is only used to check the signature; which post changed doesn't matter, because the whole post list is refetched.

## Atlas globe

`/atlas` renders the list of places on the server. `AtlasExplorer` (client) detects WebGL, reduced motion and low-power devices, then loads `Globe` with `next/dynamic` (`ssr: false`), so three.js (about 241 KB gzipped) never ships in the initial page. The canvas uses an on-demand frame loop: it draws only when the camera or the selection changes. Measured on a production build with Playwright: first globe frame 486 ms on desktop and 1061 ms on a 4x-throttled mobile profile, 5 draw calls per frame, and no draws while idle.

Markers share one geometry per shape and one material per colour. `src/lib/atlas-markers.ts` assigns category styles, and both the globe and the HTML key (`MarkerIcon`) read it, so they can't drift apart. The home page's `HomeGlobe` reuses `Globe` and the same capability hook, and mounts it only after an `IntersectionObserver` reports the section near the viewport. Visitors who never scroll there never download three.js.

## Media access

The media `read` rule also guards file downloads, because Payload's file route applies it. For anonymous requests it returns `id in (media used by published content)`. That list is built from four anonymous reads and shared across one request, so populating many images costs one lookup. Next's image optimiser fetches source files without the visitor's cookies, so draft previews pass `unoptimized` and let the editor's browser load draft-only images directly.
