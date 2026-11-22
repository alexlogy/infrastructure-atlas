# Deployment

Infrastructure Atlas runs as a single Node.js service (`pnpm build`, then `pnpm start`), backed by PostgreSQL and persistent media storage. A static export (`next export`) is not supported, because Payload needs a server.

## Requirements

| Component     | Requirement                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| Runtime       | Node.js `^24.22.3`, pnpm 11 (corepack)                                                       |
| Database      | PostgreSQL (developed against 18), reachable through `DATABASE_URI`                          |
| Media storage | A persistent, non-executable volume mounted at `/media`, or object storage (adapter planned) |
| TLS           | Terminated by the platform or a reverse proxy. HSTS is sent in production                    |

## Environment

Set these as runtime secrets in your platform. Never bake them into an image or commit them.

| Variable               | Production notes                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URI`         | Use a dedicated database user with access to this database only                                                                                                                                                                                                                          |
| `PAYLOAD_SECRET`       | At least 32 random characters, unique per environment. The app refuses weak values                                                                                                                                                                                                       |
| `NEXT_PUBLIC_SITE_URL` | The public origin, for example `https://portfolio.example.com`. Must be set when running `pnpm build`: Next.js bakes `NEXT_PUBLIC_*` values into the build, so changing it later needs a rebuild. Canonical URLs, the sitemap, robots rules and `upgrade-insecure-requests` depend on it |
| `CSP_IMG_ORIGINS`      | Optional extra image origins for the Content Security Policy (for example a CDN that serves Ghost images)                                                                                                                                                                                |
| `REVALIDATION_SECRET`  | Optional. At least 32 random characters; must match the **Secret** on the Ghost webhooks pointing at `/api/revalidate/ghost`. Empty turns the webhook off (404)                                                                                                                          |
| `NODE_ENV`             | `production`. This also disables schema push                                                                                                                                                                                                                                             |

## Release procedure

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm migrate          # apply committed migrations before the new version takes traffic
pnpm start
```

Use `GET /api/health` for readiness and liveness checks. It returns `200 {"status":"ok"}` when the database is reachable and `503 {"status":"unavailable"}` otherwise, with no further detail.

> [!WARNING]
> Run **one** app instance. Next.js keeps cached CMS reads on disk but tracks which ones a publish or delete expired only in that process's memory. `src/instrumentation.ts` empties the data cache (`.next/cache/fetch-cache`) on every start, so a restart never serves content deleted or unpublished before it. A second instance, though, would not hear about the first one's expiries and could keep showing old content. Scaling out needs a shared Next.js `cacheHandler` (for example Redis) first.

> [!IMPORTANT]
> On a brand-new production database, run `pnpm migrate` before the first start. Then open `/admin` straight away to create the first admin account, because the first-user screen stays available until an account exists. If you can, restrict access to `/admin` at the proxy until that's done.

## Backups

The database and the media storage together make up the site's content. Back them up together, so database records and the files they reference stay in sync.

```bash
# Database (custom format, compressed)
pg_dump --format=custom --no-owner "$DATABASE_URI" > atlas-$(date +%F).dump

# Media (local volume example)
tar -czf atlas-media-$(date +%F).tar.gz media/
```

- Store backups encrypted and outside the repository. `*.dump`, `*.sql` and `/backups/` are gitignored as a safety net.
- Test a restore regularly. A backup that has never been restored is unverified.

### Restore

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URI" atlas-YYYY-MM-DD.dump
tar -xzf atlas-media-YYYY-MM-DD.tar.gz
pnpm migrate     # bring the restored schema up to the deployed code's migrations
```

## Login protection

Built in:

- **Account lockout:** after 5 failed logins an account is locked for 10 minutes, even for the right password (`src/collections/Users.ts`).
- **Secure session cookie:** when `NEXT_PUBLIC_SITE_URL` is https, the `payload-token` cookie is `Secure`, `HttpOnly` and `SameSite=Lax`.
- **Password-reset throttle:** Payload accepts at most one reset request per account every 15 seconds.

Lockout is per account, so it doesn't slow down an attacker trying one password across many accounts, and anyone who knows an editor's email can keep that account locked. Add per-IP rate limiting at the reverse proxy. It belongs there rather than in the app because the proxy sees the real client address and shares limits across every app instance. An nginx example:

```nginx
# http {} block: 10 requests a minute per client address
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

# server {} block, next to the main location that proxies to the app
location ~ ^/api/users/(login|forgot-password|reset-password|unlock)$ {
    limit_req zone=auth burst=5 nodelay;
    limit_req_status 429;
    proxy_pass http://app:3000;   # same upstream and proxy headers as the main location
}
```

Behind a CDN or load balancer, configure nginx's `real_ip` module first, so `$binary_remote_addr` is the visitor's address and not the CDN's.

## Optional hardening

- Restrict `/admin` with an identity-aware proxy, VPN or IP allow-list. The trade-off is that editors must be on that network to publish.
- Run the container as a non-root user, with a read-only root filesystem except for the media volume.
