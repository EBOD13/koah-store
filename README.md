# Koah Store — Conversion Attribution System

A demo sports-apparel storefront with a built-in system for measuring which
ad platform (Google, Koah, or Facebook) actually drives purchases —
independent of whatever those platforms report themselves — using UTM
parameters.

This README explains the system end to end. Each subfolder also has its own
README going one level deeper (every class/function, and how it relates to
the others):

- [`prisma/README.md`](prisma/README.md) — the database schema and why it's shaped this way
- [`src/lib/README.md`](src/lib/README.md) — every shared function (tracking, metrics, db)
- [`src/components/README.md`](src/components/README.md) — the design system and every UI component
- [`src/app/README.md`](src/app/README.md) — every page and API route, and the full request lifecycle

## What this solves

You're running ads on three platforms and want to independently measure,
per platform:

- **User sessions** — how many unique people visited the site because of
  that platform's ad (reloading, browsing multiple products, etc. still
  counts as one person)
- **Purchases** — how many of those people went on to buy something,
  possibly from a completely different page than the one the ad linked to
- **Conversion rate** — purchases ÷ sessions

## Tech stack

**Next.js 16 (App Router) + TypeScript, Postgres, Prisma.** One app, no
separate backend service, no Redis, no native mobile apps — see
"Architecture decisions" below for why.

- **Framework**: Next.js (App Router) — Server Components query Postgres
  directly for page rendering; Route Handlers (`src/app/api/**/route.ts`)
  serve as the "backend" for anything the *browser* needs to call over
  HTTP (the tracking beacon, and documented JSON endpoints).
- **Database**: Postgres 16, run locally via `docker-compose.yml`.
- **ORM/migrations**: Prisma (pinned to the stable `6.19.3` — see note in
  "Setup" below about why not the version `npm install prisma` gives you by
  default).
- **Styling**: Tailwind CSS v4, themed entirely through CSS variables in
  `src/app/globals.css` (see `src/components/README.md`).
- **Icons**: [lucide-react](https://lucide.dev/) — one icon set, so nothing
  depends on a platform-specific icon font.

## How attribution works (the core mechanism)

There's no login on this site, so "a user" can only mean "a browser we
recognize." The system recognizes browsers with a first-party cookie,
`koah_visitor_id`, created the first time `TrackingProvider`
(`src/components/TrackingProvider.tsx`, mounted once in the root layout)
runs client-side. That single cookie is what lets a purchase made three
pages after the landing page still be attributed correctly — the
requirement that "you can't rely on UTM parameters being in the URL query
beyond the first page."

1. **Landing**: someone clicks a Google ad, arriving at
   `/?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale`.
   `TrackingProvider` creates the `koah_visitor_id` cookie, reads the UTM
   params from the URL, and POSTs both to `POST /api/track`.
2. **First-touch capture**: `/api/track` runs
   `prisma.visitor.upsert({ where: { id: visitorId }, create: { utmSource: 'google', ... }, update: {} })`.
   The `update: {}` is the entire trick: it only ever *creates* the
   `Visitor` row with that platform attached. Every later event from the
   same cookie hits the same `where` clause, finds the row already exists,
   and updates nothing.
3. **Browsing**: the visitor clicks into `/product/<id>` — a URL with *no*
   UTM parameters at all. `TrackingProvider` fires again, but since the
   `Visitor` row already exists, its `utmSource` stays `'google'`. Every
   `page_view` this visitor generates from here on is still correctly
   attributed.
4. **Purchase**: clicking "Buy Now" (`src/components/BuyButton.tsx`) posts
   a `purchase` event tied to the same `visitorId`. No new attribution
   decision is made — the purchase simply lands in the `Event` table under
   a visitor whose `utmSource` was already fixed in step 2.
5. **Dashboard**: `src/lib/metrics.ts#getPlatformMetrics` counts distinct
   `Visitor` rows per `utmSource` (→ sessions) and how many of those have
   at least one `purchase` event (→ purchases). Because de-duplication
   happens on the `Visitor` table (one row per cookie), reloading the page,
   browsing five products, or generating ten `page_view` events all still
   count as exactly one session.

The full schema and the reasoning behind it live in
[`prisma/README.md`](prisma/README.md); the full request-by-request
walkthrough (including the product-detail-page scenario) lives in
[`src/app/README.md`](src/app/README.md).

## Architecture decisions (and why)

This assignment is explicitly scoped to ~3-4 hours and says to use "any
stack you like" — it only asks for a demo *website*. To keep the system
something that can be fully explained rather than partially generated, a
few things were deliberately **not** built, even though they'd be part of
Koah's actual production stack:

- **One app, not a separate backend service.** Next.js Route Handlers serve
  every purpose a separate Rails/Express API would have here (recording
  events, serving the dashboard's JSON). Splitting that into its own
  service would add a deployment, a second language, and CORS — with zero
  benefit for a system this size.
- **Postgres only, no Redis.** Nothing in this system needs a cache or a
  pub/sub layer; a handful of indexed Postgres queries (see
  `prisma/README.md`) comfortably serve the metrics dashboard.
- **A real cookie, not `sessionStorage`.** The assignment's persistence
  requirement only assumes "the user stays in the same browser tab," but a
  180-day first-party cookie (mirroring Google Analytics' own default
  campaign-attribution window) satisfies that *and* survives across tabs
  and browser restarts, which is what "unique user" more naturally means.
- **No native iOS/Android apps or SDK.** The assignment asks for a website.
  A cross-platform SDK's whole purpose is solving problems (native icon
  sets, native component parity) this build doesn't have, because it's
  web-only.
- **A small internal design system, not literal microservices.** Reusable
  building blocks (`Button`, `Card`, `Badge`, `Table`, `StatCard`,
  `Container` — see `src/components/README.md`) achieve the "consistent,
  low-duplication UI" goal without needing separate deployable services.

## Local setup

**Requirements**: Node 20+, Docker (for local Postgres).

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install dependencies
npm install

# 3. Create the database schema
npm run db:migrate

# 4. Seed the fake product catalog
npm run db:seed

# 5. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note on the Prisma version**: `npm install prisma` today installs an
> early-access `8.0.0-rc` release with an entirely different CLI (its
> commands are `migration`/`contract`/`deploy` instead of the classic
> `migrate dev`/`db seed`). This project pins `prisma`/`@prisma/client` to
> the latest **stable** `6.x` release instead, so the workflow above matches
> what virtually all current Prisma documentation and tutorials describe.

## Manual test script

This walks through generating data for all three platforms plus direct
traffic, then verifying the dashboard:

1. In an **incognito window**, visit
   `http://localhost:3000/?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale`.
2. Click into any product's detail page (a URL with no UTM params) and
   click **Buy Now**.
3. In a **second, separate incognito window** (a fresh cookie), visit
   `http://localhost:3000/?utm_source=facebook&utm_medium=paid_social` and
   buy a product directly from the home page grid.
4. In a **third incognito window**, visit
   `http://localhost:3000/?utm_source=koah&utm_medium=cpc`, browse a
   product, but don't buy anything.
5. In a **fourth incognito window**, visit `http://localhost:3000/` with no
   query string at all (simulating direct/organic traffic).
6. Visit `http://localhost:3000/admin`. You should see:
   - **Google**: 1 session, 1 purchase, 100% conversion
   - **Facebook**: 1 session, 1 purchase, 100% conversion
   - **Koah**: 1 session, 0 purchases, 0% conversion
   - The event debugger lists every page view and purchase from all four
     windows, including the direct visit labeled **"Direct"** — which does
     **not** appear in the three-platform metrics table above.
7. Reload `/admin` after taking further actions in any of the four windows
   (buy another product, visit another page) — the numbers update live,
   since the dashboard queries the database on every request
   (`export const dynamic = 'force-dynamic'`).

You can also query the same data directly:

```bash
curl http://localhost:3000/api/admin/metrics | python3 -m json.tool
curl http://localhost:3000/api/admin/events  | python3 -m json.tool
```
