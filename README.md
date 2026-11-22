<div align="center">

# Infrastructure Atlas

**An open-source, CMS-driven interactive portfolio platform.**

Visitors get an accessible, HTML-first site with progressive 3D. Owners manage every piece of content in Payload CMS, with no code edits needed.

[Overview](#overview) · [Getting started](#getting-started) · [Content workflow](#content-workflow) · [Deployment](#deployment) · [Documentation](#documentation) · [Project status](#project-status)

![Node](https://img.shields.io/badge/node-%5E24.22.3-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![Payload](https://img.shields.io/badge/Payload_CMS-3-0F172A)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

## Overview

Infrastructure Atlas is a reusable portfolio platform, not a hard-coded personal site. Content lives in your database and media storage, never in the repository.

- **Payload CMS embedded in Next.js**: an authenticated admin panel at `/admin`, with drafts and publishing.
- **PostgreSQL** is the source of truth for portfolio content.
- **HTML-first rendering**: navigation, text and SEO work without WebGL. A lazy-loaded Three.js globe on `/atlas` and the home page is a progressive enhancement over an HTML list of places.
- **Optional Ghost integration**: lists published articles from a Ghost blog over the read-only Content API and links to the originals.

> [!IMPORTANT]
> Never commit owner content or secrets. Biographies, contact details, photos and credentials are entered through `/admin` and stored outside Git. Only `.env.example` with placeholder values belongs in the repository.

```text
Browser ──> Next.js (server components, HTML content, SEO)
              ├── /, /journey, /impact, /atlas ──> cached public queries (published only)
              │                     └── Payload Local API ──> PostgreSQL
              ├── /admin (authenticated Payload admin)
              │     └── publish/unpublish ──> cache tag expired
              ├── /api/revalidate/ghost (signed Ghost webhook) ──> cached posts expired
              └── /api/health (database readiness)
```

### Public pages

| Route            | Content                                                                                                                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | Hero (eyebrow, two-line headline and calls to action from **Home page**, with the atlas globe beside it) and a metric strip from published **Achievements**, then the Journey mountain scene and the impact dashboard                                                               |
| `/journey`       | A mountain scene: a glowing trail climbs one peak per published milestone to a gold summit (the latest). Choosing a peak shows its story and related projects below; era buttons jump between eras. A plain-text **Chronology** follows. Returns 404 when the section is turned off |
| `/impact`        | The impact dashboard (selected case study with the Leadership / Engineering switch, project tiles, and a mini atlas of the project's places), then every published project as a card. Returns 404 when the section is turned off                                                    |
| `/impact/[slug]` | One project: summary, Leadership / Engineering narrative, challenge, architecture, decisions, outcomes, limitations and sources                                                                                                                                                     |
| `/atlas`         | Globe with a side panel (chosen place and its stories, plus a searchable index), then every published place with its linked projects and milestones. Returns 404 when the section is turned off                                                                                     |
| `/about`         | **Philosophy**: opening statement, introduction, principles, current focus, credentials (expired ones labelled) and the contact section. Returns 404 until there is content                                                                                                         |
| `/lab`           | **Engineering Lab**: the featured entry large with its diagram, then the rest as cards with status, tags and an outbound link; filter by tag with `?tag=`. Returns 404 until an entry is published                                                                                  |
| `/writing`       | Lead story (first featured post, else the newest), then the rest as a 16:9 card grid, with tag filters (`?tag=`). Each card links to the original article. Returns 404 when Ghost is not configured or the section is off                                                           |

The Leadership / Engineering switch is a pair of links, so it works without JavaScript and every state has its own URL: `/impact/<slug>?view=engineering`. The active option is marked with `aria-current`, a fill and a check mark. If a project has only one narrative, the switch is hidden and that narrative is shown.

On the Journey scene, milestones are ordered by date (then `sortOrder`) and the latest one sits on the summit, so the summit changes when you publish a newer milestone. Links like `/journey#milestone-<id>` open with that milestone selected. The trail draws in when it scrolls into view and each marker lights up as the trail reaches it, then the gold summit pulses three times, unless the visitor prefers reduced motion.

The impact dashboard shows the projects chosen under **Home page → Featured projects** (or, if none, projects marked featured). Each project's optional **category** and **icon** label its tile. Choosing a tile or a perspective changes the URL (`?project=<slug>&view=engineering`), so every view can be linked to and works without JavaScript. The mini atlas appears when the selected project lists published places.

On `/atlas`, the list of places is the main content and works without JavaScript or WebGL. When WebGL is available, a globe loads afterwards, facing the starting view set in **Site settings** (Asia-Pacific by default). Markers come from published locations, and arcs connect the places a published project lists, in order. Each location **category** gets its own marker shape and colour (cyan or ice; gold marks the selected place), explained in a key under the globe and shown on each place card. Uncategorised places use a cyan circle. Clicking a marker or a place's **Show on globe** button selects it in both views, and links like `/atlas#place-<id>` open with that place selected. The globe only draws a frame when something changes, keeps the scroll wheel for the page, and skips the camera animation when the visitor prefers reduced motion.

The home hero places the globe beside the headline when the Atlas section is on and places are published (otherwise the optional hero image). It turns slowly until the visitor points at it, and stops for good once a place is chosen from the card's place buttons or the globe; it never turns with reduced motion or on low-power devices. The metric strip under the hero shows up to four published **Achievements** and disappears when there are none: figures are only ever typed in by an editor. The globe draws Natural Earth coastlines (public domain), loaded only with the globe.

Every page shares one shell: a sticky header that marks the current page, an outlined contact button when **Site settings → Contact button** has a link, and a footer with the same links, the Ghost blog (when configured) and a back-to-top link. Below 1024px the links move into a **Menu** button that closes on Escape and returns focus. Content sits in a container about 1320px wide.

Pages are rendered on the server as plain HTML, so they work without JavaScript or WebGL. They read only published records through narrow, server-only queries (`src/lib/payload/public.ts`) that select just the fields they display, and they map each record to a small display object before it reaches React. When the CMS is empty, the pages show a short explanation instead of sample content.

Every public page sets a canonical URL and Open Graph and Twitter tags built from published CMS data. Project pages use their featured image; other pages use the optional **share image** from Site settings. `/sitemap.xml` lists the home page, the enabled sections and published projects. It never lists drafts, and includes `/writing` only when Ghost is set up. `/robots.txt` keeps crawlers out of `/admin` and `/api/`. Absolute URLs come from `NEXT_PUBLIC_SITE_URL`, so set it to your public address when you build for production.

The home page moves between sections as you scroll: the hero globe fades back as it leaves the screen, the distant mountain ranges rise as the Journey arrives, a gold line runs from the summit into Impact, and headers and cards rise in with a slight stagger. These follow the scroll position, so scrolling, Page Down and anchor links always behave normally. They are plain CSS, so no extra 3D renders while you scroll, and browsers without scroll-driven animations show the finished page.

Accessibility built in: a skip link, landmarks and a sensible heading order, a visible focus ring, colours checked for WCAG AA contrast (most pass AAA), and motion that only plays when the visitor's browser allows it (reduced motion turns every animation off). Featured milestones are labelled in text as well as colour, and measured outcomes are distinguished from qualitative ones in text.

### Tech stack

| Concern         | Choice                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Web application | Next.js 16 (App Router), React 19, TypeScript strict                                                    |
| CMS             | Payload 3 with the official PostgreSQL adapter                                                          |
| Database        | PostgreSQL 18 (Docker Compose locally)                                                                  |
| Styling         | Tailwind CSS 4 with Midnight Atlas design tokens; Space Grotesk and Inter via `next/font` (self-hosted) |
| 3D              | three 0.187 and @react-three/fiber 9.8 (supports React >=19 <19.4); Drei not needed yet                 |
| Validation      | zod for environment configuration                                                                       |
| Testing         | Vitest, Playwright                                                                                      |
| Tooling         | pnpm 11 (via corepack), ESLint (flat config), Prettier                                                  |
| CI              | GitHub Actions, `pnpm audit`, gitleaks                                                                  |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) `^24.22.3`. The exact version is in `.nvmrc`.
- pnpm 11 via corepack: run `corepack enable pnpm`. The exact version is pinned in `package.json`.
- [Docker](https://www.docker.com/) with Compose, for the local database.

### Local setup

```bash
pnpm install
cp .env.example .env          # then set a real PAYLOAD_SECRET (see below)
pnpm db:up                    # local PostgreSQL (docker/compose.dev.yml)
pnpm dev
```

Open <http://localhost:3000> for the site and <http://localhost:3000/admin> for the CMS.

Generate a strong secret for `PAYLOAD_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The local database binds to `127.0.0.1:5432`. On first start, Docker creates two databases: `infrastructure_atlas` for development and `infrastructure_atlas_test` for tests.

### Environment variables

| Variable                             | Scope       | Required | Purpose                                                                                                                            |
| ------------------------------------ | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URI`                       | Server      | Yes      | PostgreSQL connection string                                                                                                       |
| `PAYLOAD_SECRET`                     | Server      | Yes      | Signs auth tokens. Production requires at least 32 characters and rejects the placeholder                                          |
| `NEXT_PUBLIC_SITE_URL`               | Browser     | No       | Public site origin, default `http://localhost:3000`. Set it **at build time**: Next.js bakes `NEXT_PUBLIC_*` values into the build |
| `TEST_DATABASE_URI`                  | Server/test | Tests    | Separate database used by integration and e2e tests                                                                                |
| `GHOST_URL`, `GHOST_CONTENT_API_KEY` | Server      | No       | Ghost blog address and a read-only Content API key. Leave both empty to turn Writing off                                           |
| `CSP_IMG_ORIGINS`                    | Server      | No       | Extra image origins for the Content Security Policy, space or comma separated (the Ghost origin is always allowed)                 |
| `REVALIDATION_SECRET`                | Server      | No       | Signing secret for the Ghost webhook, at least 32 characters. Leave empty to turn the webhook off                                  |
| `PAYLOAD_DB_PUSH`                    | Server/dev  | No       | `true` by default in development. Set to `false` to use migrations only                                                            |

The app validates its configuration at startup and reports which variables are wrong without printing their values.

### Scripts

| Command                    | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                 | Start the dev server (Payload pushes schema changes automatically)           |
| `pnpm build`, `pnpm start` | Build and run in production mode                                             |
| `pnpm lint`                | ESLint                                                                       |
| `pnpm typecheck`           | TypeScript, no emit                                                          |
| `pnpm format`              | Prettier write (`format:check` to verify only)                               |
| `pnpm test`                | Vitest unit and integration tests (integration tests need the test database) |
| `pnpm test:e2e`            | Playwright end-to-end tests (starts its own server on port 3100)             |
| `pnpm generate:types`      | Regenerate `src/payload-types.ts`                                            |
| `pnpm migrate:create`      | Generate a migration from schema changes                                     |
| `pnpm migrate`             | Apply pending migrations                                                     |

### Testing

| Layer       | Tool       | Location      | Covers                                                                                                                                                                                       |
| ----------- | ---------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest     | `tests/unit/` | Date formatting, link and slug safety, perspective selection, mapping CMS records to display data, ordering, environment checks                                                              |
| Integration | Vitest     | `tests/int/`  | Payload access rules against a real Postgres: drafts never leak, anonymous writes are refused, roles, slug and coordinate validation, and the publish hooks that clear the cache             |
| End-to-end  | Playwright | `tests/e2e/`  | Publishing a milestone or project and seeing it live, the perspective switch, the atlas with and without WebGL, keyboard navigation, reduced motion, pages without JavaScript, mobile layout |

Integration and e2e tests only run against `TEST_DATABASE_URI`, and they refuse to start unless the database name ends in `_test`. They apply the committed migrations, clear the test data, and create a throwaway editor with a random password for each run. No known credentials or real content are used.

```bash
pnpm db:up                                   # creates infrastructure_atlas_test on first start
pnpm test                                    # unit + integration
pnpm exec playwright install chromium        # first run only
pnpm test:e2e                                # end-to-end
```

> [!TIP]
> If a migration ever stops with "It looks like you've run Payload in dev mode", the test database was schema-pushed by mistake. Reset it with `pnpm payload migrate:fresh` (with `DATABASE_URI` pointing at the test database).

### Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`. It needs no secrets, live content or Ghost account.

| Job     | What it checks                                                                                |
| ------- | --------------------------------------------------------------------------------------------- |
| verify  | `format:check`, `lint`, `typecheck`, `test`, `build`, against a Postgres 18 service container |
| e2e     | Playwright (Chromium) against a Postgres 18 service container                                 |
| audit   | `pnpm audit --audit-level high`                                                               |
| secrets | gitleaks over the full Git history                                                            |

Run the same checks locally before you push:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e
pnpm audit --audit-level high
```

> [!NOTE]
> Security fixes for some packages that other dependencies pull in are pinned under `overrides` in `pnpm-workspace.yaml`. Remove each entry once the upstream package ships the patched version itself.

## Content workflow

### Create the first admin account

On a fresh database, open `/admin`. Payload shows a one-time **Create first user** screen that is only available while no users exist. That first account always becomes an **admin**. Use a unique email and a strong password. The project never seeds a default admin or a known password.

Admins can then invite more people from **Users**:

| Role   | Can do                                                             |
| ------ | ------------------------------------------------------------------ |
| Admin  | Manage users and roles, plus everything an editor can do           |
| Editor | Create, edit and publish content and media; edit their own account |

There is no public sign-up, and editors can't change their own role.

### Content model

| Name                  | Kind       | Public visitors can see                                                                 |
| --------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `timeline-milestones` | Collection | Published milestones only. Drafts stay private                                          |
| `impact-projects`     | Collection | Published projects only. Their milestone and location links are not shown yet           |
| `atlas-locations`     | Collection | Published locations only, on `/atlas`                                                   |
| `achievements`        | Collection | Published figures only, in the home page metric strip                                   |
| `site-settings`       | Global     | Title, description, locale, navigation links, section visibility                        |
| `home-page`           | Global     | Eyebrow, two-line headline, subheadline, hero image, calls to action, featured projects |
| `about-page`          | Global     | Philosophy statement, principles, current focus, credentials, portrait, contact section |
| `writing-settings`    | Global     | Whether Writing is on, how many recent posts, tag filters, featured post slugs          |
| `media`               | Collection | Every uploaded file                                                                     |
| `users`               | Collection | Nothing                                                                                 |

Milestones have a start date, an optional end date, and a date precision (year, month or day) that controls how dates are displayed. They also support a short rich-text description, era, tags, an image, a featured flag, and a `sortOrder` that breaks ties between milestones on the same date.

Projects have a slug (generated from the title if left empty), a summary, separate leadership and engineering narratives, and optional challenge, architecture, diagram, decisions, outcomes, limitations and source links. An outcome with a `metric` is shown as measured; without one it is labelled qualitative. Only record outcomes you can back up, and use the verification note to say how.

Atlas locations store latitude and longitude (validated to ±90 / ±180) with a precision. Published coordinates are public, so use a city centre rather than a private site.

Media uploads accept JPEG, PNG, WebP, AVIF and GIF files up to 10 MB. SVG is rejected because it can contain scripts.

### Database migrations

- **Development:** `pnpm dev` pushes schema changes straight to your local database.
- **Before merging schema changes:** run `pnpm migrate:create` and commit the generated files in `src/migrations/`.
- **Production:** run `pnpm migrate` before starting the new release. Never rely on schema push in production.

### Publish a milestone

1. In `/admin`, open **Milestones** and select **Create new**.
2. Fill in a title, a start date and a date precision, then select **Save draft**. Drafts never appear on the public site or in anonymous API responses.
3. Select **Publish changes**. The public timeline cache is cleared straight away.
4. Open <http://localhost:3000/journey>. The milestone appears as a peak on the mountain trail (on the summit if it is the latest) and in the **Chronology** list, where the date is shown at the precision you chose (for example "2020", "Mar 2020" or "Mar 1, 2020").

Projects work the same way: create one under **Impact projects**, publish it, and it appears on `/impact` and at `/impact/<slug>`. To feature it on the homepage, add it to **Home page → Featured projects**. Unpublished projects are skipped there automatically.

Unpublishing or deleting a milestone removes it from `/journey` on the next request. Changes to **Site settings** and **Home page** show up immediately too.

### Connect a Ghost blog (optional)

1. In Ghost admin, open **Settings → Integrations → Add custom integration** and copy the **Content API key**. Never use the Admin API key.
2. Set `GHOST_URL` (for example `https://blog.example.com`) and `GHOST_CONTENT_API_KEY` in the server environment, then restart.
3. In `/admin`, open **Writing settings** to choose how many recent posts to show, filter by tag slug, and list featured post slugs in order.

4. Optional, for instant updates: set `REVALIDATION_SECRET` to a random value of at least 32 characters (for example `openssl rand -hex 32`) and restart. Then, in the same Ghost integration, add a webhook for each of **Post published**, **Published post updated**, **Post unpublished** and **Post deleted**, with target URL `https://<your-site>/api/revalidate/ghost` and the same value as its **Secret**.

Without the webhook, new Ghost posts appear on `/writing` within 15 minutes. With it, they appear on the next visit. If Ghost is slow or down, the page shows the last posts it fetched, or a short "temporarily unavailable" note. It never breaks the rest of the site. Featured slugs that were renamed or deleted in Ghost are skipped.

### Preview a draft

While signed in to `/admin`, open a milestone or project and select **Preview**. The real page opens with your latest drafts and a "Preview mode" banner. Select **Exit preview** in the banner to go back to the published view.

Preview only works with a valid admin session, checked again on every page load, so a leftover preview cookie shows nothing after you sign out. Visitors can't turn it on, and the preview link only redirects to pages on this site. Projects get a **Preview** button once they have a slug.

> [!NOTE]
> Rich-text links are only rendered when they point to a site path or an `http(s)`/`mailto` URL. Any other link is shown as plain text.

> [!TIP]
> If `pnpm dev` starts returning 500 errors with `Jest worker encountered 2 child process exceptions` after you've run `pnpm build`, delete the `.next/` folder and restart the dev server.

## Deployment

Infrastructure Atlas needs a **Node.js runtime**. A static `next export` can't host Payload. A deployment has three parts:

1. **The app:** `pnpm build` then `pnpm start` on any Node.js host, or the Docker image in `docker/` (see below). Run a single instance: cache expiry lives in the server's memory, so several instances would not share it (see [docs/deployment.md](docs/deployment.md)). The server empties its data cache on every start, so a restart never brings back deleted or unpublished content.
2. **PostgreSQL:** a managed or self-hosted instance, set through `DATABASE_URI`.
3. **Persistent media storage:** local uploads go to `/media`, which is gitignored. In production, use a persistent volume or object storage.

Health checks can use `GET /api/health`. It returns `200 {"status":"ok"}` when the database is reachable, and `503 {"status":"unavailable"}` otherwise.

> [!WARNING]
> Set a unique `PAYLOAD_SECRET` of at least 32 characters in production. The app refuses to start with a short or placeholder secret.

### Docker

Everything Docker-related lives in `docker/`. `docker/compose.yml` runs the whole stack: PostgreSQL, a one-shot job that applies migrations, then the app, which starts only after the migrations succeed.

```bash
cp docker/.env.example docker/.env     # set NEXT_PUBLIC_SITE_URL, PAYLOAD_SECRET, POSTGRES_PASSWORD
docker compose -f docker/compose.yml up -d --build
```

The app listens on `127.0.0.1:3000` (change it with `APP_PORT`). Put a TLS reverse proxy in front, then open `/admin` to create the first admin account. Uploads and the database live in named volumes (`media`, `pgdata`). The image runs as a non-root user and contains only the built server, with no `.env`, tests or uploads. Rebuild after changing `NEXT_PUBLIC_SITE_URL`, because it's baked into the build. CI builds the image, smoke-tests the stack and scans the image for vulnerabilities. Details are in [docs/deployment.md](docs/deployment.md#docker).

To have nginx terminate TLS in front of the app, put `fullchain.pem` and `privkey.pem` in `docker/nginx/certs/` (gitignored) and add the sample override:

```bash
docker compose -f docker/compose.yml -f docker/compose.nginx.yml up -d --build
```

The sample config (`docker/nginx/atlas.conf`) redirects HTTP to HTTPS, serves HTTP/2 and rate-limits the login endpoints. With it, the app's port is no longer published, so all traffic goes through nginx. See [docs/deployment.md](docs/deployment.md#nginx-optional-sample).

### Security baseline

- GraphQL is disabled. The REST API stays enabled for the admin panel and is protected by collection access rules.
- Every response gets baseline security headers: `nosniff`, `Referrer-Policy`, frame protection, `Permissions-Policy`, and HSTS in production. Every page also gets a per-request nonce Content Security Policy (see [docs/security.md](docs/security.md)).
- After 5 failed logins an account is locked for 10 minutes. On https the session cookie is `Secure`. Add per-IP rate limiting at your reverse proxy (the sample nginx config in `docker/nginx/atlas.conf` does this).
- Visitors can only fetch an uploaded image while published content uses it. Images attached only to a draft, or to nothing, need an admin session. Editors still see draft images in preview.

### Backup and restore

Back up the **database** and the **media storage** together, so database records and the files they reference stay in sync.

```bash
# Backup (local development database)
docker compose -f docker/compose.dev.yml exec -T db pg_dump -U app_user -Fc infrastructure_atlas > backup.dump

# Restore into an existing database
docker compose -f docker/compose.dev.yml exec -T db pg_restore -U app_user -d infrastructure_atlas --clean < backup.dump
```

> [!CAUTION]
> Database dumps contain your private content. `*.dump` and `*.sql` files are gitignored. Store backups encrypted and outside the repository.

For the full production procedure (applying migrations before the new version takes traffic, the first-admin window on a new database, media backup, and optional hardening), see [docs/deployment.md](docs/deployment.md).

## Documentation

| Guide                                  | What it covers                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Architecture](docs/architecture.md)   | How the runtime fits together, module boundaries, the publish → refresh → render flow, caching, schema lifecycle |
| [Content model](docs/content-model.md) | Every collection and global, its fields and validation, and who can read or write it                             |
| [Deployment](docs/deployment.md)       | Requirements, environment variables, release steps, health checks, backup and restore                            |
| [Security](docs/security.md)           | Where content and secrets live, access control, input and output safety, headers, dependency policy, known gaps  |

## Project status

| Phase                                                                           | Status |
| ------------------------------------------------------------------------------- | ------ |
| 0. Scaffold, tooling, local database                                            | Done   |
| 1. CMS-driven MVP: milestone slice (publish milestone → `/journey`)             | Done   |
| 1. CMS-driven MVP: home page content, projects, Leadership / Engineering switch | Done   |
| 1. Authenticated draft preview                                                  | Done   |
| 2. Three.js atlas globe                                                         | Done   |
| 3. Ghost writing integration                                                    | Done   |
| 3. Sitemap, robots rules, canonical and Open Graph metadata                     | Done   |
| 3. Content Security Policy                                                      | Done   |
| 3. Signed Ghost webhook for instant updates                                     | Done   |
| 3. Login lockout, Secure session cookie, proxy rate-limit guide                 | Done   |
| 3. Media visible only while published content uses it                           | Done   |
| Design foundation: tokens, fonts, sticky header, mobile menu, footer            | Done   |
| Mountain Journey scene on the home page and `/journey`                          | Done   |
| Three-column impact dashboard on the home page and `/impact`                    | Done   |
| Hero with globe, metric strip (achievements), coastlines, idle spin             | Done   |
| Philosophy page, home philosophy preview and contact section                    | Done   |
| Engineering Lab page and home preview                                           | Done   |
| Writing lead story, card grid and tag filters; atlas side panel and search      | Done   |
| Scroll-driven section transitions and Journey marker reveal                     | Done   |
