# Database (`prisma/`)

This folder is the entire "database" layer of the system: the schema
(`schema.prisma`), the generated migration history (`migrations/`), and the
seed script that populates the fake product catalog (`seed.ts`).

The database is Postgres, run locally via `docker-compose.yml` in the repo
root. [Prisma](https://www.prisma.io/) is the ORM/migration tool: it reads
`schema.prisma`, generates a fully-typed query client
(`@prisma/client`, used everywhere as `import { prisma } from '@/lib/db'`),
and turns schema edits into SQL migration files under `migrations/`.

## Why only two real tables

The entire attribution system reduces to two questions: **"who is this
visitor, and what platform brought them here?"** and **"what did they do?"**
That maps to exactly two tables, `Visitor` and `Event`, plus a `Product`
table for the fake catalog.

### `Visitor`

One row per unique browser. A visitor's identity is a UUID stored in a
first-party cookie (`koah_visitor_id`, see `src/lib/tracking.ts`) — there is
no login, so the cookie *is* the user, exactly the way Google Analytics'
`client_id` or a `_ga` cookie works.

| Field         | Meaning                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| `id`          | The UUID from the visitor's cookie. Primary key.                        |
| `utmSource`   | `'google'` \| `'koah'` \| `'facebook'` \| `null` (direct/no-campaign traffic) |
| `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent` | The other four standard UTM parameters, captured for completeness even though only `utmSource` drives the dashboard's metrics. |
| `landingUrl`  | The exact URL this visitor's very first request hit.                    |
| `createdAt`   | When this visitor was first seen.                                       |

**Why attribution lives on `Visitor`, not on `Event`:** every event a visitor
ever generates (browsing five products, reloading, buying) needs to resolve
to the *same* platform — the one that brought them to the site the first
time. Storing `utmSource` once per visitor and letting every `Event` merely
reference `visitorId` makes that a foreign-key join instead of "remember to
copy the right value onto every event." It also directly implements the
assignment's "attribute purchases back to the UTM param on the initial page"
requirement: whatever UTM values are present the *first* time a visitor row
is created become permanent, because of the upsert rule described below —
they are never overwritten by later events from the same visitor.

`utmSource` is nullable because plenty of traffic won't come from one of the
three ad platforms at all (someone typing the URL directly, a bookmark, a
page reload with no query string). Those visitors still need a row — they
still generate page_view/purchase events that belong in the raw event log —
they just aren't counted in the per-platform metrics table, which only
looks at `utmSource IN ('google', 'koah', 'facebook')`.

### `Event`

An append-only log: one row per page view or purchase, ever.

| Field       | Meaning                                                         |
| ----------- | ------------------------------------------------------------------ |
| `id`        | Primary key.                                                    |
| `type`      | `'page_view'` \| `'purchase'` (a Postgres enum, `EventType`).    |
| `url`       | The page URL the event happened on.                             |
| `visitorId` | Foreign key → `Visitor.id`. Cascades on delete.                  |
| `productId` | Foreign key → `Product.id`, only set for `purchase` events.      |
| `createdAt` | Timestamp.                                                       |

This table is the single source of truth for both halves of the dashboard:
the metrics table (`src/lib/metrics.ts#getPlatformMetrics`) aggregates it,
and the event debugger (`getEventDebugRows`) just renders it directly,
newest first.

### `Product`

The fake catalog (12 sports items seeded by `seed.ts`): `name`, `price` (in
**cents**, to avoid floating-point rounding bugs — see
`src/lib/utils.ts#formatPrice` for how it's turned back into a display
string), `category`, `imageUrl`.

## Relationships

```
Visitor (1) ───< (many) Event >─── (0..1) Product
```

One `Visitor` has many `Event`s. One `Event` optionally references one
`Product` (only when `type = 'purchase'`). There is no relationship between
`Visitor` and `Product` directly — you only ever learn "did visitors from
platform X buy anything" by joining through `Event`.

## The one rule that makes attribution work

Everything above is just storage. The actual attribution *logic* is one
line, in `src/app/api/track/route.ts`:

```ts
prisma.visitor.upsert({
  where: { id: visitorId },
  create: { id: visitorId, utmSource: utm?.utm_source ?? null, /* ... */ },
  update: {}, // <- intentionally does nothing
})
```

`update: {}` means: if this visitor already has a row, touch nothing. The
very first event we ever see from a given `visitorId` decides its
`utmSource` forever. See `src/app/README.md` for the full walkthrough of
that route.

## Commands

```bash
npm run db:migrate   # prisma migrate dev — create/apply a migration from schema changes
npm run db:seed      # prisma db seed — repopulate the Product table
npm run db:studio    # prisma studio — a GUI to browse the actual rows
```
