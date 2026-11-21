<div align="center">

# Infrastructure Atlas

**An open-source, CMS-driven interactive portfolio platform.**

Visitors get an accessible, HTML-first site with progressive 3D. Owners manage every piece of content in Payload CMS, with no code edits needed.

[Overview](#overview) · [Getting started](#getting-started) · [Content workflow](#content-workflow) · [Deployment](#deployment) · [Project status](#project-status)

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
              ├── Payload Local API ──> PostgreSQL
              ├── /admin (authenticated Payload admin)
              └── /api/health (database readiness)
```

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

The app validates its configuration at startup and reports which variables are wrong without printing their values.

### Scripts

| Command                    | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                 | Start the dev server (Payload pushes schema changes automatically) |
| `pnpm build`, `pnpm start` | Build and run in production mode                                   |
| `pnpm lint`                | ESLint                                                             |
| `pnpm typecheck`           | TypeScript, no emit                                                |
| `pnpm format`              | Prettier write (`format:check` to verify only)                     |
| `pnpm test`                | Vitest unit and integration tests                                  |
| `pnpm test:e2e`            | Playwright end-to-end tests                                        |
| `pnpm generate:types`      | Regenerate `src/payload-types.ts`                                  |
| `pnpm migrate:create`      | Generate a migration from schema changes                           |
| `pnpm migrate`             | Apply pending migrations                                           |

### Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`. It needs no secrets, live content or Ghost account.

| Job     | What it checks                                                                                |
| ------- | --------------------------------------------------------------------------------------------- |
| verify  | `format:check`, `lint`, `typecheck`, `test`, `build`, against a Postgres 18 service container |
| audit   | `pnpm audit --audit-level high`                                                               |
| secrets | gitleaks over the full Git history                                                            |

Run the same checks locally before you push:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
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

| Name                  | Kind       | Public visitors can see                                          |
| --------------------- | ---------- | ---------------------------------------------------------------- |
| `timeline-milestones` | Collection | Published milestones only. Drafts stay private                   |
| `site-settings`       | Global     | Title, description, locale, navigation links, section visibility |
| `media`               | Collection | Every uploaded file                                              |
| `users`               | Collection | Nothing                                                          |

Milestones have a start date, an optional end date, and a date precision (year, month or day) that controls how dates are displayed. They also support a short rich-text description, era, tags, an image, a featured flag, and a `sortOrder` that breaks ties between milestones on the same date.

Media uploads accept JPEG, PNG, WebP, AVIF and GIF files up to 10 MB. SVG is rejected because it can contain scripts.

### Database migrations

- **Development:** `pnpm dev` pushes schema changes straight to your local database.
- **Before merging schema changes:** run `pnpm migrate:create` and commit the generated files in `src/migrations/`.
- **Production:** run `pnpm migrate` before starting the new release. Never rely on schema push in production.

### Publish a milestone

1. In `/admin`, open **Milestones** and select **Create new**.
2. Fill in a title, a start date and a date precision, then select **Save draft**. Drafts never appear on the public site or in anonymous API responses.
3. Select **Publish changes**. The public timeline cache is cleared straight away, so the milestone shows up on the next page load.

> [!NOTE]
> The public `/journey` page that displays published milestones is the next item in the Phase 1 slice.

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

## Project status

| Phase                                             | Status      |
| ------------------------------------------------- | ----------- |
| 0. Scaffold, tooling, local database              | Done        |
| 1. CMS-driven MVP: milestones, timeline, projects | In progress |
| 2. Three.js atlas globe                           | Planned     |
| 3. Ghost writing integration and polish           | Planned     |
