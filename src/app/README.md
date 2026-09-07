# Routes (`src/app/`)

This is a Next.js **App Router** project, so folder structure *is* routing:
every folder with a `page.tsx` is a page, every folder with a `route.ts` is
an API endpoint, and `layout.tsx` wraps everything. This folder is also
where the "backend" of the system actually lives — there's no separate
Express/Rails process; the `api/` routes below are it (see the root
`README.md`'s "Why one app, not a separate backend" section for the
reasoning).

## Pages

### `layout.tsx` — the root layout

Wraps every page in `<html>`/`<body>`, loads the Geist fonts, and renders
`<TrackingProvider>` around `<Header>` + `{children}`. Because this is the
*root* layout, it renders exactly once per full page load and persists
across client-side navigations — which is exactly why `TrackingProvider`
lives here: it only has to be mounted once for its "fire a page_view on
every route change" behavior to cover the entire app.

### `page.tsx` — storefront home (`/`)

An `async` Server Component. Queries `prisma.product.findMany(...)`
directly (not via `/api/products`) and renders one `<ProductCard>` per
product in a responsive grid. `export const dynamic = 'force-dynamic'`
tells Next.js not to prerender/cache this page at build time, since the
product list can change (from `db:seed`) and we always want the live table
state, not a stale build-time snapshot.

**Why fetch directly instead of calling `/api/products`?** Server
Components can talk to Postgres directly — there's no browser involved yet,
so there's no reason to serialize a request, send it over HTTP to itself,
and deserialize the response. `/api/products` still exists (see below) as a
plain, curl-able JSON endpoint, but the page itself skips that hop.

### `product/[id]/page.tsx` — product detail (`/product/:id`)

Also an `async` Server Component; `params` is a `Promise<{ id: string }>`
(Next.js 15+ convention — dynamic route params are always async now, hence
`const { id } = await params`). Looks the product up with
`prisma.product.findUnique`, calls Next's `notFound()` if it doesn't exist,
and renders a bigger single-product layout with a `<BuyButton>`.

This page exists specifically to exercise the **attribution persistence**
requirement: a visitor can land on `/?utm_source=google`, click into a
product here — a URL with no UTM parameters anywhere in it — and buy from
this page. The purchase must still land under "google" in the dashboard.
That works because attribution is resolved from the `koah_visitor_id`
cookie server-side (in `/api/track`), never from the current page's URL.

### `admin/page.tsx` — the metrics dashboard (`/admin`)

Also an `async` Server Component (no auth, per the spec). Calls
`getPlatformMetrics()` and `getEventDebugRows()` from `@/lib/metrics`
directly — the same two functions the `api/admin/*` routes below call —
and renders three summary `<StatCard>`s, `<MetricsTable>`, and
`<EventsTable>`.

## API routes (the "backend")

Every route here is a `route.ts` file exporting `GET`/`POST` functions that
receive/return the standard Web `Request`/`Response` objects (Next's
`NextRequest`/`NextResponse` wrap them for convenience).

### `POST /api/track` — the core of the attribution system

Called by the client (`src/lib/tracking.ts`'s `trackPageView` and
`trackPurchase`) for **every** page view and purchase. Body:
`{ visitorId, type, url, productId?, utm? }`. After validating the
required fields, it runs one `prisma.$transaction` with two writes:

1. `prisma.visitor.upsert(...)` with `update: {}` — creates the `Visitor`
   row (capturing `utm.*`) the first time this `visitorId` is seen, and
   does *nothing* on every subsequent call. This one line is the entire
   first-touch attribution rule.
2. `prisma.event.create(...)` — appends the `page_view`/`purchase` row.

Both in one transaction so an event is never recorded for a visitor that
doesn't exist. Full reasoning in `prisma/README.md`.

### `GET /api/products`

Returns the product catalog as JSON. Exists as a documented, external
entry point into the catalog (e.g. `curl localhost:3000/api/products`); the
storefront page itself queries Prisma directly instead of calling this (see
above).

### `GET /api/admin/metrics`

Returns `PlatformMetrics[]` — calls `getPlatformMetrics()` from
`@/lib/metrics`. Same data the admin page's `<MetricsTable>` renders,
exposed as JSON so it can be inspected independently
(`curl localhost:3000/api/admin/metrics`).

### `GET /api/admin/events`

Returns `EventDebugRow[]` — calls `getEventDebugRows()` from
`@/lib/metrics`. Same data the admin page's `<EventsTable>` renders.

## Request lifecycle, end to end

1. An ad click lands a browser on `/?utm_source=google&utm_medium=cpc`.
2. `TrackingProvider` (mounted in `layout.tsx`) notices the route, ensures a
   `koah_visitor_id` cookie exists, parses the UTM params, and POSTs to
   `/api/track` with `type: 'page_view'`.
3. `/api/track` upserts a `Visitor` row for that cookie id — this is the
   *only* moment `utmSource: 'google'` ever gets written to the database —
   and inserts a `page_view` `Event`.
4. The visitor clicks into `/product/<id>` (no UTM in this URL).
   `TrackingProvider` fires again; `/api/track` sees the same
   `visitorId`, so the upsert's `update: {}` does nothing — attribution is
   already fixed to google.
5. The visitor clicks "Buy Now". `BuyButton` calls `trackPurchase`, which
   POSTs `type: 'purchase'` with the same `visitorId`. Another `Event` row
   is appended; the `Visitor` row (and its `utmSource`) is untouched.
6. On `/admin`, `getPlatformMetrics()` counts this visitor once under
   "google" (1 session, 1 purchase, 100% conversion), and
   `getEventDebugRows()` lists both of their events with `platform: 'google'`.
