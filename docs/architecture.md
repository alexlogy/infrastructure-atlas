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

## Visual system

The Midnight Atlas tokens live in `src/app/(frontend)/styles.css` as Tailwind 4 `@theme` variables (`bg-surface`, `text-muted`, `text-gold`, ...), with their WCAG contrast ratios noted beside them. Cyan (`accent`) leads interaction; gold marks significance only (the career summit, outcomes, the selected place). Shared utilities cover the page container (`container-page`, about 1320px with responsive gutters), section rhythm (`section-y`), the eyebrow label and a fluid type scale (`text-hero`, `text-page`, `text-section`). Space Grotesk (headings) and Inter (body) are self-hosted by `next/font` at build time, so visitors' browsers never contact Google and the CSP keeps `font-src 'self'`.

The header is sticky with a translucent background that stays readable without `backdrop-filter`. Below 1024px the links move into a disclosure menu (`HeaderNav`, a client component) that closes on Escape, on a link choice or on navigation and returns focus to its button. The current page is marked with `aria-current="page"` and an underline, not colour alone. `scroll-padding-top` keeps anchor targets clear of the header.

## Journey scene

The Journey is a layered SVG landscape, not WebGL. `src/lib/journey.ts` computes everything from the number of published milestones: one peak per milestone rising left to right with a valley between each pair, the last on the summit, and a smooth (Catmull-Rom) crest that the glowing trail follows. Nothing positional is stored in the CMS. `JourneyScene` (server) formats each stop and renders every milestone's detail card, so rich text never reaches a client bundle; `MountainJourney` (client) draws the art, puts a real `<button>` on each peak (`aria-current="step"` on the selected one) and swaps in the chosen card. Labels never overlap because the scene has a minimum width of 12.5rem per gap and scrolls sideways inside its own region on narrow screens, keeping the selected stop in view. The trail draws once when it first scrolls into view; if it is already visible, or the visitor prefers reduced motion, it is simply shown. Without JavaScript every stop and the summit's details are still in the HTML, and `/journey` also lists every milestone as plain text under **Chronology**.

## Impact dashboard

The home page and `/impact` share one three-column band (`ImpactDashboard`): the selected case study with the Leadership / Engineering switch (about 45%), a stack of project tiles (20%) and a regional mini atlas of that project's places (35%). Tiles come from **Home page → Featured projects**, else projects marked featured, else the first published ones (`src/lib/impact.ts`, at most four). All state is in the URL (`?project=<slug>&view=engineering`) and every control is a link, so it works without JavaScript and each view can be shared; with JavaScript the links navigate without scrolling and the case study crossfades. The case study shows short plain-text excerpts (`richTextExcerpt`) in a fixed order per perspective (Challenge → Approach → Outcome, or Architecture → Decisions → Trade-offs, mapped from `challenge`, `leadershipNarrative` and the first outcome, or `architecture`/`engineeringNarrative`, `decisions` and `limitations`); the full rich text stays on the project page. The regional column only appears when the selected project lists published places; its card and place buttons are HTML, and the globe behind them loads lazily like the home globe. Below 1280px it moves under the other two columns, and on phones everything stacks: case study, tiles, then places.

## Home page order

The home page follows the design's narrative: hero with globe and metric strip, Journey scene, impact dashboard, philosophy preview, Lab preview, selected writing (three posts), then the contact section. Every section renders only when it has published content and its switch in Site settings is on, so an empty CMS still gives a coherent page.

## Atlas globe

`/atlas` renders the list of places on the server. `AtlasExplorer` (client) detects WebGL, reduced motion and low-power devices, then loads `Globe` with `next/dynamic` (`ssr: false`), so three.js (about 241 KB gzipped) never ships in the initial page. The canvas uses an on-demand frame loop: it draws only when the camera or the selection changes. Measured on a production build with Playwright: first globe frame 486 ms on desktop and 1061 ms on a 4x-throttled mobile profile, 5 draw calls per frame, and no draws while idle.

The globe draws Natural Earth 110m coastlines (public domain) from `public/generic/coastlines.json` (66 KB, 26 KB gzipped), fetched only once a globe mounts and regenerated with `node scripts/build-coastlines.mjs` from the `world-atlas` dev dependency. Latitude and longitude lines stay faint; the atmosphere is a CSS glow behind the transparent canvas, not a shader. Markers share one geometry per shape and one material per colour. `src/lib/atlas-markers.ts` assigns category styles (shape plus cyan or ice), and both the globe and the HTML key (`MarkerIcon`) read it, so they can't drift apart. Gold is reserved for the selected place.

`PlaceGlobe` pairs a globe with an HTML card and place buttons; the home hero and the impact dashboard both use it. It mounts the globe only after an `IntersectionObserver` reports it near the viewport. In the hero nothing is selected at first and the globe turns slowly (about 120 s a revolution): frames are requested only while spinning, and the spin stops when the pointer rests on it, on a drag or a selection, and never runs with reduced motion or on low-detail devices.

## Writing and the atlas index

`/writing` leads with the first featured Ghost post (else the newest), then the remaining featured and recent posts as a 3/2/1 grid of 16:9 cards; posts without a feature image get a quiet gradient panel so the grid stays even. Tags from the listed posts become filter links (`?tag=`, shared `TagFilter` component, also used on `/lab`); unknown tags are ignored. Ghost is still queried only through the cached loader, so filtering never adds requests.

On `/atlas` the globe takes about two thirds of the width and a side panel the rest: the chosen place's details and stories (a polite live region), then a searchable index. Index entries are `#place-<id>` links, so without JavaScript they jump to the place's card in the full list below; with JavaScript they select the place in place.

## Media access

The media `read` rule also guards file downloads, because Payload's file route applies it. For anonymous requests it returns `id in (media used by published content)`. That list is built from four anonymous reads and shared across one request, so populating many images costs one lookup. Next's image optimiser fetches source files without the visitor's cookies, so draft previews pass `unoptimized` and let the editor's browser load draft-only images directly.
