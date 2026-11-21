# Content model

Payload schemas live in `src/collections/` and `src/globals/`. Types are generated into `src/payload-types.ts` with `pnpm generate:types`. Every schema change needs a committed migration (`pnpm migrate:create`).

## Access summary

| Slug                  | Kind       | Anonymous read          | Create / update / delete                               | Drafts |
| --------------------- | ---------- | ----------------------- | ------------------------------------------------------ | ------ |
| `users`               | Collection | None                    | Admins. Editors can update themselves (not their role) | No     |
| `media`               | Collection | All files (public URLs) | Authenticated                                          | No     |
| `timeline-milestones` | Collection | Published only          | Authenticated                                          | Yes    |
| `site-settings`       | Global     | Yes                     | Authenticated                                          | No     |

GraphQL is disabled. Anonymous readers can never see version history (`readVersions`).

## `users`

| Field   | Type                      | Notes                                                                                                   |
| ------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `email` | email (Payload auth)      | Login identifier                                                                                        |
| `role`  | select: `admin`, `editor` | Required and saved in the JWT. Only admins can change it. The first account is always forced to `admin` |

There is no public registration. New users must be created by an admin.

## `media`

| Field         | Type | Notes                                                 |
| ------------- | ---- | ----------------------------------------------------- |
| `alt`         | text | Required, describes the image for screen-reader users |
| `attribution` | text | Optional credit or licence note shown with the image  |

Accepted types are JPEG, PNG, WebP, AVIF and GIF, up to 10 MB. SVG is rejected because it can contain scripts. Files are stored in `/media` locally and are publicly readable by URL.

## `timeline-milestones`

| Field           | Type                           | Notes                                                         |
| --------------- | ------------------------------ | ------------------------------------------------------------- |
| `title`         | text, required, ≤ 120          |                                                               |
| `subtitle`      | text, ≤ 160                    |                                                               |
| `startDate`     | date, required                 |                                                               |
| `endDate`       | date                           | Must be on or after `startDate`                               |
| `datePrecision` | select: `year`, `month`, `day` | Controls the public label ("2020", "Mar 2020", "Mar 1, 2020") |
| `description`   | rich text (Lexical)            | Paragraphs, bold, italic, lists and external links only       |
| `era`           | text, ≤ 60                     | Free-text grouping label                                      |
| `tags`          | text, many, ≤ 12               |                                                               |
| `image`         | upload → `media`               |                                                               |
| `featured`      | checkbox                       | Shown with a text label and a gold accent                     |
| `sortOrder`     | number                         | Breaks ties between milestones on the same date (lower first) |

Public ordering is `startDate` ascending, then `sortOrder`, then `title`. Drafts are versioned, with up to 50 versions kept per milestone.

## `site-settings` (global)

| Field              | Type                        | Notes                                                                                           |
| ------------------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `siteTitle`        | text, ≤ 80                  | Empty means a neutral default ("Infrastructure Atlas")                                          |
| `description`      | textarea, ≤ 300             | Homepage introduction and default meta description                                              |
| `locale`           | text (BCP 47)               | Sets `<html lang>` and the date formatting locale                                               |
| `navLinks`         | array (≤ 8) of label + href | `href` must be a site path or an `http(s)`/`mailto` URL. Links are checked again at render time |
| `sections.journey` | checkbox                    | Hides `/journey` (404) and its navigation link                                                  |

## Rules for new content types

- Put owner information in the CMS, never in source files, fixtures or seeds.
- Give every new public query `overrideAccess: false`, an explicit `select`, and a mapper to a view model.
- Collections with drafts need a `publishedOrAuthenticated` read rule and hooks that expire their cache tag only when published content changes.
