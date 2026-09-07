# Shared Logic (`src/lib/`)

This folder holds every non-visual function in the app: the Prisma client,
the client-side tracking helpers, the server-side metrics aggregation, and
small formatting utilities. Nothing here renders anything — everything that
does (pages, components) *calls into* this folder.

## `db.ts` — the Prisma client singleton

```ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
```

One `PrismaClient` instance (and its connection pool) per server process.
It's stashed on `globalThis` in development because Next.js hot-reloads
route modules on every file save; without the `globalThis` cache, every
reload would create a brand-new `PrismaClient` (and a brand-new connection
pool) that's never closed, quickly exhausting Postgres's connection limit.
**Every** database read in the app — every API route, every server
component page, `lib/metrics.ts` — imports `prisma` from here. There is
exactly one place a `PrismaClient` is constructed.

## `tracking.ts` — client-side tracking primitives

This file has `'use client'` at the top: everything in it runs in the
browser, not on the server. It's the client-side half of the attribution
system (the server-side half is `src/app/api/track/route.ts`, documented in
`src/app/README.md`).

- **`getOrCreateVisitorId(): string`** — reads the `koah_visitor_id` cookie;
  if it doesn't exist yet (this browser has never been seen), generates a
  `crypto.randomUUID()` and writes it as a cookie with a 180-day expiry.
  This id is the entire "who is this user" mechanism for the whole system —
  see `prisma/README.md`'s `Visitor` section for why a cookie (not
  sessionStorage) was chosen. Called by both `trackPageView` and
  `trackPurchase` before they send anything to the server, so the cookie
  always exists by the time an event is recorded.

- **`parseUtmParams(searchParams: URLSearchParams): UtmParams`** — pulls the
  five standard UTM query parameters (`utm_source`, `utm_medium`,
  `utm_campaign`, `utm_term`, `utm_content`) out of a `URLSearchParams`
  instance. Returns `null` for any that are absent from the URL. Called
  only by `TrackingProvider` (`src/components/TrackingProvider.tsx`), which
  is the one place in the app that reads the current URL's query string.

- **`postEvent(payload: TrackEventPayload)`** *(private)* — the one function
  that actually calls `fetch('/api/track', ...)`. Wrapped in a try/catch
  that silently swallows network errors, because a failed tracking call
  must never break the shopping experience for the user.

- **`trackPageView(url, utm)`** — called once per route change by
  `TrackingProvider`. Resolves the visitor id, then posts
  `{ visitorId, type: 'page_view', url, utm }`.

- **`trackPurchase(productId, url)`** — called by `BuyButton` when someone
  clicks "Buy Now". Posts `{ visitorId, type: 'purchase', url, productId }`.

Both `trackPageView` and `trackPurchase` are thin: they resolve the visitor
id and shape a payload. All the actual attribution *decision-making* (is
this visitor new? do these UTM params get recorded or ignored?) happens
server-side, in `/api/track`, not here — the client's only job is to report
what happened and where.

## `metrics.ts` — server-side aggregation

Two functions, both `async`, both querying Postgres directly via `prisma`
from `db.ts`. These are the only two functions in the whole app that know
how to turn raw `Event`/`Visitor` rows into dashboard numbers — both the
admin **page** (`src/app/admin/page.tsx`) and the admin **API routes**
(`src/app/api/admin/*/route.ts`) call these same two functions, so the
aggregation logic exists in exactly one place regardless of which caller
needs it.

- **`getPlatformMetrics(): Promise<PlatformMetrics[]>`** — for each of
  `google` / `koah` / `facebook`, runs two `prisma.visitor.count()` queries:
  one for `utmSource = platform` (→ *sessions*), one for `utmSource =
  platform AND events: { some: { type: 'purchase' } }` (→ *purchases*).
  Conversion rate is just `purchases / sessions * 100` (0 if there were no
  sessions, avoiding a division-by-zero `NaN`). Both counts are `Visitor`
  counts — see `prisma/README.md` for why counting visitors rather than
  events is what makes "reloading counts as 1 user" work for free.

- **`getEventDebugRows(): Promise<EventDebugRow[]>`** — one
  `prisma.event.findMany` with `include: { visitor: true, product: true }`,
  ordered newest-first, mapped into the flat shape the event debugger table
  wants: `platform` becomes `visitor.utmSource ?? 'direct'`, `productName`
  becomes `product?.name ?? null`.

## `utils.ts` — formatting helpers

- **`cn(...classes)`** — joins conditional Tailwind class names, filtering
  out falsy values (`false`, `null`, `undefined`). Every component in
  `src/components/ui` uses this instead of manual template-string
  concatenation, so an optional/conditional class (e.g. a variant-dependent
  color) can be written as `cn(base, condition && 'extra-class')`.
- **`formatPrice(cents: number): string`** — turns a price stored in cents
  (e.g. `8900`) into a display string (`"$89.00"`) via
  `toLocaleString('en-US', { style: 'currency', currency: 'USD' })`.

## Why `tracking.ts` and `metrics.ts` are separate files

They never call each other and run in different environments:
`tracking.ts` is browser-only (`'use client'`, uses `document.cookie` and
`fetch`), `metrics.ts` is server-only (imports `prisma`, which cannot run in
a browser). Splitting them means neither file accidentally pulls
server-only or browser-only code into the wrong bundle.
