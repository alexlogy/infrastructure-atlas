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
- **HTML-first rendering**: navigation, text and SEO work without WebGL. A Three.js globe will be added as a progressive enhancement.
- **Optional Ghost integration** (planned): imports published article listings over the read-only Content API.

> [!IMPORTANT]
> Never commit owner content or secrets. Biographies, contact details, photos and credentials are entered through `/admin` and stored outside Git. Only `.env.example` with placeholder values belongs in the repository.

```text
Browser ──> Next.js (server components, HTML content, SEO)
              ├── /, /journey, /impact ──> cached public queries (published only)
              │                     └── Payload Local API ──> PostgreSQL
              ├── /admin (authenticated Payload admin)
              │     └── publish/unpublish ──> cache tag expired
              └── /api/health (database readiness)
```

### Public pages

| Route            | Content                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | Headline, introduction, hero image and calls to action from **Home page** (falling back to **Site settings**), plus featured projects in the chosen order |
| `/journey`       | Published milestones, oldest first, with dates, era, tags, image and description. Returns 404 when the section is turned off                              |
| `/impact`        | Published projects as cards, ordered by `sortOrder`. Returns 404 when the section is turned off                                                           |
| `/impact/[slug]` | One project: summary, Leadership / Engineering narrative, challenge, architecture, decisions, outcomes, limitations and sources                           |

The Leadership / Engineering switch is a pair of links, so it works without JavaScript and every state has its own URL: `/impact/<slug>?view=engineering`. The active option is marked with `aria-current`, a fill and a check mark. If a project has only one narrative, the switch is hidden and that narrative is shown.

Pages are rendered on the server as plain HTML, so they work without JavaScript or WebGL. They read only published records through narrow, server-only queries (`src/lib/payload/public.ts`) that select just the fields they display, and they map each record to a small display object before it reaches React. When the CMS is empty, the pages show a short explanation instead of sample content.

Accessibility built in: a skip link, landmarks and a sensible heading order, a visible focus ring, colours checked for WCAG AA contrast (most pass AAA), and an entry animation that only plays when the visitor's browser allows motion. Featured milestones are labelled in text as well as colour, and measured outcomes are distinguished from qualitative ones in text.

### Tech stack

| Concern         | Choice                                                 |
| --------------- | ------------------------------------------------------ |
| Web application | Next.js 16 (App Router), React 19, TypeScript strict   |
| CMS             | Payload 3 with the official PostgreSQL adapter         |
| Database        | PostgreSQL 18 (Docker Compose locally)                 |
| Styling         | Tailwind CSS 4 with Midnight Atlas design tokens       |
| Validation      | zod for environment configuration                      |
| Testing         | Vitest, Playwright                                     |
| Tooling         | pnpm 11 (via corepack), ESLint (flat config), Prettier |
| CI              | GitHub Actions, `pnpm audit`, gitleaks                 |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) `^24.22.3`. The exact version is in `.nvmrc`.
- pnpm 11 via corepack: run `corepack enable pnpm`. The exact version is pinned in `package.json`.
- [Docker](https://www.docker.com/) with Compose, for the local database.

### Local setup

```bash
pnpm install
cp .env.example .env          # then set a real PAYLOAD_SECRET (see below)
docker compose up -d db
pnpm dev
```

Open <http://localhost:3000> for the site and <http://localhost:3000/admin> for the CMS.

Generate a strong secret for `PAYLOAD_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The local database binds to `127.0.0.1:5432`. On first start, Docker creates two databases: `infrastructure_atlas` for development and `infrastructure_atlas_test` for tests.

### Environment variables

| Variable                             | Scope       | Required | Purpose                                                                                   |
| ------------------------------------ | ----------- | -------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URI`                       | Server      | Yes      | PostgreSQL connection string                                                              |
| `PAYLOAD_SECRET`                     | Server      | Yes      | Signs auth tokens. Production requires at least 32 characters and rejects the placeholder |
| `NEXT_PUBLIC_SITE_URL`               | Browser     | No       | Public site origin, default `http://localhost:3000`                                       |
| `TEST_DATABASE_URI`                  | Server/test | Tests    | Separate database used by integration and e2e tests                                       |
| `GHOST_URL`, `GHOST_CONTENT_API_KEY` | Server      | No       | Optional Ghost Content API integration (planned)                                          |
| `REVALIDATION_SECRET`                | Server      | No       | Optional webhook verification (planned)                                                   |
| `PAYLOAD_DB_PUSH`                    | Server/dev  | No       | `true` by default in development. Set to `false` to use migrations only                   |

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

| Layer       | Tool       | Location      | Covers                                                                                                                                                                           |
| ----------- | ---------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest     | `tests/unit/` | Date formatting, link and slug safety, perspective selection, mapping CMS records to display data, ordering, environment checks                                                  |
| Integration | Vitest     | `tests/int/`  | Payload access rules against a real Postgres: drafts never leak, anonymous writes are refused, roles, slug and coordinate validation, and the publish hooks that clear the cache |
| End-to-end  | Playwright | `tests/e2e/`  | Publishing a milestone or project and seeing it live, the perspective switch, keyboard navigation, reduced motion, pages without JavaScript, mobile layout                       |

Integration and e2e tests only run against `TEST_DATABASE_URI`, and they refuse to start unless the database name ends in `_test`. They apply the committed migrations, clear the test data, and create a throwaway editor with a random password for each run. No known credentials or real content are used.

```bash
docker compose up -d db                      # creates infrastructure_atlas_test on first start
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

| Name                  | Kind       | Public visitors can see                                                       |
| --------------------- | ---------- | ----------------------------------------------------------------------------- |
| `timeline-milestones` | Collection | Published milestones only. Drafts stay private                                |
| `impact-projects`     | Collection | Published projects only. Their milestone and location links are not shown yet |
| `atlas-locations`     | Collection | Published locations only (for the Phase 2 globe; no page reads them yet)      |
| `site-settings`       | Global     | Title, description, locale, navigation links, section visibility              |
| `home-page`           | Global     | Headline, subheadline, hero image, calls to action, featured projects         |
| `media`               | Collection | Every uploaded file                                                           |
| `users`               | Collection | Nothing                                                                       |

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
4. Open <http://localhost:3000/journey>. The milestone appears in date order, and the date is shown at the precision you chose (for example "2020", "Mar 2020" or "Mar 1, 2020").

Projects work the same way: create one under **Impact projects**, publish it, and it appears on `/impact` and at `/impact/<slug>`. To feature it on the homepage, add it to **Home page → Featured projects**. Unpublished projects are skipped there automatically.

Unpublishing or deleting a milestone removes it from `/journey` on the next request. Changes to **Site settings** and **Home page** show up immediately too.

### Preview a draft

While signed in to `/admin`, open a milestone or project and select **Preview**. The real page opens with your latest drafts and a "Preview mode" banner. Select **Exit preview** in the banner to go back to the published view.

Preview only works with a valid admin session, checked again on every page load, so a leftover preview cookie shows nothing after you sign out. Visitors can't turn it on, and the preview link only redirects to pages on this site. Projects get a **Preview** button once they have a slug.

> [!NOTE]
> Rich-text links are only rendered when they point to a site path or an `http(s)`/`mailto` URL. Any other link is shown as plain text.

> [!TIP]
> If `pnpm dev` starts returning 500 errors with `Jest worker encountered 2 child process exceptions` after you've run `pnpm build`, delete the `.next/` folder and restart the dev server.

## Deployment

Infrastructure Atlas needs a **Node.js runtime**. A static `next export` can't host Payload. A deployment has three parts:

1. **The app:** `pnpm build` then `pnpm start`, on any Node.js host or container platform.
2. **PostgreSQL:** a managed or self-hosted instance, set through `DATABASE_URI`.
3. **Persistent media storage:** local uploads go to `/media`, which is gitignored. In production, use a persistent volume or object storage.

Health checks can use `GET /api/health`. It returns `200 {"status":"ok"}` when the database is reachable, and `503 {"status":"unavailable"}` otherwise.

> [!WARNING]
> Set a unique `PAYLOAD_SECRET` of at least 32 characters in production. The app refuses to start with a short or placeholder secret.

### Security baseline

- GraphQL is disabled. The REST API stays enabled for the admin panel and is protected by collection access rules.
- Every response gets baseline security headers: `nosniff`, `Referrer-Policy`, frame protection, `Permissions-Policy`, and HSTS in production. A full Content Security Policy is planned.
- Uploaded media files can be fetched by anyone who has the URL. Don't upload confidential files.

### Backup and restore

Back up the **database** and the **media storage** together, so database records and the files they reference stay in sync.

```bash
# Backup (local Docker example)
docker compose exec -T db pg_dump -U app_user -Fc infrastructure_atlas > backup.dump

# Restore into an existing database
docker compose exec -T db pg_restore -U app_user -d infrastructure_atlas --clean < backup.dump
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

| Phase                                                                           | Status  |
| ------------------------------------------------------------------------------- | ------- |
| 0. Scaffold, tooling, local database                                            | Done    |
| 1. CMS-driven MVP: milestone slice (publish milestone → `/journey`)             | Done    |
| 1. CMS-driven MVP: home page content, projects, Leadership / Engineering switch | Done    |
| 1. Authenticated draft preview                                                  | Done    |
| 2. Three.js atlas globe                                                         | Planned |
| 3. Ghost writing integration and polish                                         | Planned |
