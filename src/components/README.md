# Components (`src/components/`)

Everything visual in the app is built from a small set of primitives in
`ui/`, composed into feature components (`ProductCard`, `BuyButton`,
`MetricsTable`, `EventsTable`, `Header`) and one piece of invisible
plumbing (`TrackingProvider`). The goal of this split: change a color,
radius, or spacing value once in `src/app/globals.css` or in one `ui/`
primitive, and every screen picks it up — no page hardcodes a hex value or
a one-off button style.

## `ui/` — the design system

All five primitives read color through the Tailwind tokens defined in
`src/app/globals.css` (`bg-accent`, `text-muted-foreground`, `border-border`,
etc.) rather than hardcoded values, so re-theming the whole app means
editing that one CSS file.

- **`Button`** (`Button.tsx`) — the only button in the app. Two axes of
  variation, both fixed, small sets: `variant` (`primary` / `secondary` /
  `ghost`) and `size` (`sm` / `md`). Forwards a `ref` (via `forwardRef`) and
  spreads any native `<button>` prop, so it's a drop-in replacement for
  `<button>` everywhere. Used directly by `BuyButton`.

- **`Card`** (`Card.tsx`) — a bordered, rounded surface (`bg-card`,
  `border-border`, `rounded-2xl`). Used by `ProductCard` (product tiles) and
  `StatCard` (dashboard metric tiles) — anything that needs to look like a
  distinct "block" on the page uses this instead of redeclaring the same
  border/radius classes.

- **`Badge`** (`Badge.tsx`) — a small pill with a `tone` prop (`neutral` /
  `accent` / `success` / `danger`) that maps to a background/text color
  pair. Used for platform names and event types in `MetricsTable` and
  `EventsTable` — it does **not** force capitalization itself (that's left
  to the call site via a `capitalize` className) because "purchase" /
  "page view" read better lowercase while platform names ("Google",
  "Facebook") read better capitalized.

- **`Container`** (`Container.tsx`) — centers content and caps its width
  (`max-w-5xl`). The one layout wrapper every page (`page.tsx`,
  `product/[id]/page.tsx`, `admin/page.tsx`) renders its content inside, so
  page width/margins stay consistent without each page re-deciding them.

- **`Table` / `Thead` / `Tbody` / `Tr` / `Th` / `Td`** (`Table.tsx`) — plain
  table building blocks sharing one set of border/padding/hover classes.
  `MetricsTable` and `EventsTable` both compose these instead of each
  defining their own table styling, which is why they look identical
  despite showing completely different data.

- **`StatCard`** (`StatCard.tsx`) — a `Card` laid out as `label` + big
  `value` + optional `icon`. Used for the three top-of-dashboard tiles
  (Total Sessions / Total Purchases / Overall Conversion Rate) in
  `src/app/admin/page.tsx`.

Icons throughout the app (`ShoppingBag`, `Check`, `BarChart3`, `Dumbbell`,
`ArrowLeft`, `Users`, `ShoppingCart`, `TrendingUp`) come from
[`lucide-react`](https://lucide.dev/) — a single icon set that's just React
components, so there's no "does this icon exist on this platform" concern
the way there would be mixing OS-specific icon fonts.

## Feature components

- **`Header.tsx`** — the site-wide nav bar: a logo/home link and a link to
  `/admin`. Rendered once, in `src/app/layout.tsx`, so it appears on every
  page.

- **`ProductCard.tsx`** — one product tile in the storefront grid
  (`src/app/page.tsx`). Pure presentational: image, category, name (both
  linking to `/product/[id]`), price (via `formatPrice`), and a
  `<BuyButton>`. Has no interactivity of its own — it's a Server Component
  that composes one client component (`BuyButton`), which is why it needs
  no `'use client'` directive itself.

- **`BuyButton.tsx`** — the *only* place `trackPurchase()` is called from.
  Used by both `ProductCard` (the grid) and `product/[id]/page.tsx` (the
  detail page) so there's a single implementation of "what happens when you
  click buy": fire the purchase event, then show a 2-second "Added ✓"
  confirmation state before reverting to "Buy Now" (via a `purchased`
  boolean in local `useState` + `setTimeout`). This is a client component
  (`'use client'`) because it needs that local state and an `onClick`
  handler — everything importing it can stay a plain Server Component.

- **`MetricsTable.tsx`** — renders the per-platform metrics table (platform,
  sessions, purchases, conversion rate) required by the "Metrics dashboard"
  spec. Purely presentational: takes a `PlatformMetrics[]` prop and renders
  it via the `ui/Table` primitives. All the counting happened before this
  component ever runs, in `src/lib/metrics.ts#getPlatformMetrics`.

- **`EventsTable.tsx`** — renders the raw "event debugger" table (time,
  type, platform, product, page URL). Same shape as `MetricsTable`: a dumb
  renderer over an `EventDebugRow[]` prop, with a friendly empty-state
  message when there are no events yet.

## `TrackingProvider.tsx` — the invisible one

Mounted once, wrapping `{children}` in `src/app/layout.tsx`, so it's present
on every route without any individual page having to remember to include
it. It renders nothing itself — its only job is to make sure a `page_view`
event fires on every navigation. See `src/lib/README.md` and
`src/app/README.md` for the full mechanics (why it's split into an outer
provider and an inner `<Suspense>`-wrapped `PageViewTracker`).

## The chain, end to end

```
layout.tsx
  └─ TrackingProvider           (fires trackPageView on every route change)
       └─ Header
       └─ {page content}
            page.tsx        → ProductCard → BuyButton → trackPurchase()
            product/[id]/page.tsx → BuyButton → trackPurchase()
            admin/page.tsx  → MetricsTable, EventsTable  (no client code — pure render)
```
