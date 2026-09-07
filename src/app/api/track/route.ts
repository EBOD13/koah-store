import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { TrackEventPayload } from '@/types'

/**
 * POST /api/track — records one page_view or purchase event.
 *
 * This route is the entire server-side half of the attribution system:
 *
 * 1. `visitor.upsert` — creates the Visitor row the *first* time we see this
 *    visitorId, capturing whatever UTM params were on the URL at that
 *    moment. The `update: {}` clause is intentionally a no-op: if the
 *    Visitor already exists, we do NOT touch its utm* fields. That single
 *    line is what makes attribution "first-touch" — a visitor who lands
 *    from a Google ad and later clicks a Facebook ad in a new tab (same
 *    cookie) still gets counted as a Google-attributed visitor.
 * 2. `event.create` — appends the raw page_view/purchase row that both the
 *    metrics endpoint and the event debugger read from.
 *
 * Both writes happen in one transaction so we never record an event for a
 * visitor that doesn't exist.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<TrackEventPayload>
  const { visitorId, type, url, productId, utm } = body

  if (!visitorId || !type || !url) {
    return NextResponse.json(
      { error: 'visitorId, type, and url are required' },
      { status: 400 }
    )
  }
  if (type !== 'page_view' && type !== 'purchase') {
    return NextResponse.json({ error: 'invalid event type' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.visitor.upsert({
      where: { id: visitorId },
      create: {
        id: visitorId,
        utmSource: utm?.utm_source ?? null,
        utmMedium: utm?.utm_medium ?? null,
        utmCampaign: utm?.utm_campaign ?? null,
        utmTerm: utm?.utm_term ?? null,
        utmContent: utm?.utm_content ?? null,
        landingUrl: url,
      },
      update: {},
    }),
    prisma.event.create({
      data: {
        visitorId,
        type,
        url,
        productId: type === 'purchase' ? productId ?? null : null,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
