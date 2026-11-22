# Content model

Payload schemas live in `src/collections/` and `src/globals/`. Types are generated into `src/payload-types.ts` with `pnpm generate:types`. Every schema change needs a committed migration (`pnpm migrate:create`).

## Access summary

| Slug                  | Kind       | Anonymous read                       | Create / update / delete                               | Drafts |
| --------------------- | ---------- | ------------------------------------ | ------------------------------------------------------ | ------ |
| `users`               | Collection | None                                 | Admins. Editors can update themselves (not their role) | No     |
| `media`               | Collection | Only media used by published content | Authenticated                                          | No     |
| `timeline-milestones` | Collection | Published only                       | Authenticated                                          | Yes    |
| `impact-projects`     | Collection | Published only                       | Authenticated                                          | Yes    |
| `atlas-locations`     | Collection | Published only                       | Authenticated                                          | Yes    |
| `achievements`        | Collection | Published only                       | Authenticated                                          | Yes    |
| `site-settings`       | Global     | Yes                                  | Authenticated                                          | No     |
| `home-page`           | Global     | Yes                                  | Authenticated                                          | No     |
| `writing-settings`    | Global     | Yes                                  | Authenticated                                          | No     |

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

Accepted types are JPEG, PNG, WebP, AVIF and GIF, up to 10 MB. SVG is rejected because it can contain scripts. Files are stored in `/media` locally. Visitors can read a file only while published content uses it; see `docs/security.md`.

## `timeline-milestones`

| Field           | Type                             | Notes                                                         |
| --------------- | -------------------------------- | ------------------------------------------------------------- |
| `title`         | text, required, ≤ 120            |                                                               |
| `subtitle`      | text, ≤ 160                      |                                                               |
| `startDate`     | date, required                   |                                                               |
| `endDate`       | date                             | Must be on or after `startDate`                               |
| `datePrecision` | select: `year`, `month`, `day`   | Controls the public label ("2020", "Mar 2020", "Mar 1, 2020") |
| `description`   | rich text (Lexical)              | Paragraphs, bold, italic, lists and external links only       |
| `era`           | text, ≤ 60                       | Free-text grouping label                                      |
| `tags`          | text, many, ≤ 12                 |                                                               |
| `image`         | upload → `media`                 |                                                               |
| `featured`      | checkbox                         | Shown with a text label and a gold accent                     |
| `sortOrder`     | number                           | Breaks ties between milestones on the same date (lower first) |
| `location`      | relationship → `atlas-locations` | Optional; used by the Phase 2 atlas                           |

Public ordering is `startDate` ascending, then `sortOrder`, then `title`. Drafts are versioned, with up to 50 versions kept per milestone.

## `impact-projects`

| Field                                                   | Type                                             | Notes                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `title`                                                 | text, required, ≤ 120                            |                                                                                                                                 |
| `slug`                                                  | text, required, unique, ≤ 80                     | Lowercase words and single hyphens. Generated from the title when left empty                                                    |
| `summary`                                               | textarea, required, ≤ 300                        | Card text and meta description                                                                                                  |
| `category`, `icon`                                      | text ≤ 40, select                                | Label and line icon on the impact dashboard tiles (`cloud`, `server`, `network`, `shield`, `chart`, `people`, `code`, `layers`) |
| `featuredImage`, `diagram`                              | upload → `media`                                 |                                                                                                                                 |
| `tags`                                                  | text, many, ≤ 12                                 |                                                                                                                                 |
| `leadershipNarrative`, `engineeringNarrative`           | rich text                                        | The two perspectives. The switch only appears when both are filled in                                                           |
| `challenge`, `architecture`, `decisions`, `limitations` | rich text                                        | Shared by both perspectives                                                                                                     |
| `outcomes`                                              | array (≤ 12): `result`, `metric`, `verification` | A `metric` marks a measured outcome; none means qualitative                                                                     |
| `sourceLinks`                                           | array (≤ 8): `label`, `url`                      | `url` must be a site path or an `http(s)`/`mailto` URL; checked again at render time                                            |
| `milestones`, `locations`                               | relationships                                    | Stored for later phases; public queries do not select them                                                                      |
| `featured`, `sortOrder`                                 | checkbox, number                                 | Listing order is `sortOrder`, then `title`                                                                                      |

Publish, unpublish and delete expire the `projects` cache tag. A pending draft never replaces the published version on the site.

## `atlas-locations`

| Field                       | Type                                         | Notes                                                                                                                 |
| --------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `label`                     | text, required, ≤ 80                         |                                                                                                                       |
| `city`, `region`, `country` | text, optional                               |                                                                                                                       |
| `latitude`                  | number, required, −90 to 90                  | Published coordinates are public: use city-level points                                                               |
| `longitude`                 | number, required, −180 to 180                |                                                                                                                       |
| `precision`                 | select: `exact`, `city`, `region`, `country` | Defaults to `city`                                                                                                    |
| `category`                  | text, ≤ 40                                   | Marker shape and colour on the globe, plus the key on `/atlas`. Styles are assigned A–Z and repeat after 7 categories |
| `sortOrder`                 | number                                       | Lower first                                                                                                           |

Visibility is controlled by draft/publish; there is no separate display toggle. `/atlas` shows published locations; projects that reference two or more of them draw arcs between consecutive ones. Publish changes expire the `atlas` cache tag.

## `home-page` (global)

| Field              | Type                                  | Notes                                                      |
| ------------------ | ------------------------------------- | ---------------------------------------------------------- |
| `eyebrow`          | text, ≤ 60                            | Small accent line above the headline                       |
| `headline`         | text, ≤ 120                           | Empty falls back to the site title                         |
| `headlineEmphasis` | text, ≤ 120                           | Optional second headline line, shown in cyan               |
| `subheadline`      | textarea, ≤ 400                       | Empty falls back to the site description                   |
| `heroImage`        | upload → `media`                      | Shown in the hero only when the atlas has no places        |
| `callsToAction`    | array (≤ 2) of label + href           | Empty shows links to the enabled sections                  |
| `featuredProjects` | relationship → `impact-projects`, ≤ 6 | Shown in this order; only published projects are displayed |

Saving expires the `home-page` cache tag.

## `achievements`

Figures for the compact strip under the home page hero. Nothing is computed or filled in automatically: the strip only appears once a published achievement exists, and shows up to four in `sortOrder`.

| Field         | Type                             | Notes                                                                 |
| ------------- | -------------------------------- | --------------------------------------------------------------------- |
| `value`       | text, required, ≤ 16             | The figure as displayed, e.g. "12"                                    |
| `unit`        | text, ≤ 12                       | Optional suffix in gold, e.g. "+" or "%"                              |
| `label`       | text, required, ≤ 60             | Caption under the figure                                              |
| `explanation` | textarea, ≤ 300                  | How the figure was arrived at; read to screen readers, shown on hover |
| `icon`        | select (same set as projects)    | Gold line icon                                                        |
| `project`     | relationship → `impact-projects` | Optional source project                                               |
| `sortOrder`   | number                           | Lower first                                                           |

Publishing or unpublishing expires the `achievements` cache tag.

## `writing-settings` (global)

| Field                        | Type                       | Notes                                                                                                  |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `enabled`                    | checkbox, default on       | Writing only appears when this is on **and** `GHOST_URL` and `GHOST_CONTENT_API_KEY` are set           |
| `recentCount`                | number, 1 to 20, default 6 | Recent posts to show, newest first                                                                     |
| `includeTags`, `excludeTags` | text, many, ≤ 10 each      | Ghost tag slugs. Validated so they can't inject filter syntax                                          |
| `featuredSlugs`              | text, many, ≤ 6            | Ghost post slugs, shown first in this order and left out of the recent list. Missing posts are skipped |

The Ghost address and key are environment variables, never CMS fields. Saving expires the `writing-settings` cache tag. Ghost posts themselves are cached for 15 minutes under the `ghost` tag.

## `site-settings` (global)

| Field                                           | Type                        | Notes                                                                                                                      |
| ----------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `siteTitle`                                     | text, ≤ 80                  | Empty means a neutral default ("Infrastructure Atlas")                                                                     |
| `description`                                   | textarea, ≤ 300             | Homepage introduction and default meta description                                                                         |
| `locale`                                        | text (BCP 47)               | Sets `<html lang>` and the date formatting locale                                                                          |
| `shareImage`                                    | upload → `media`            | Default Open Graph/Twitter image when a page has none of its own (1200×630 works best)                                     |
| `navLinks`                                      | array (≤ 8) of label + href | `href` must be a site path or an `http(s)`/`mailto` URL. Links are checked again at render time                            |
| `contact.label`, `contact.href`                 | text, text                  | Outlined button at the right of the header and in the footer. Hidden until `href` is set; label defaults to "Get in touch" |
| `sections.journey`                              | checkbox                    | Hides `/journey` (404) and its navigation link                                                                             |
| `sections.impact`                               | checkbox                    | Hides `/impact` and project pages (404), the navigation link and homepage featured projects                                |
| `sections.atlas`                                | checkbox                    | Hides `/atlas` (404) and its navigation link                                                                               |
| `atlasCenter.latitude`, `atlasCenter.longitude` | number (±90 / ±180)         | Where the globe faces on load. Empty means 5°N 115°E (Asia-Pacific)                                                        |

## Rules for new content types

- Put owner information in the CMS, never in source files, fixtures or seeds.
- Give every new public query `overrideAccess: false`, an explicit `select`, and a mapper to a view model.
- Collections with drafts need a `publishedOrAuthenticated` read rule and hooks that expire their cache tag only when published content changes.
- A new field that references `media` must be added to `src/access/publishedMedia.ts`, or its images stay hidden from visitors. An integration test fails until you do.
