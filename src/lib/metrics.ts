import { prisma } from '@/lib/db'
import { PLATFORMS, type PlatformMetrics, type EventDebugRow } from '@/types'

/**
 * Computes, for each of the three ad platforms, how many unique visitors
 * were first attributed to it ("sessions") and how many of those visitors
 * ever made a purchase. Both counts are `Visitor` counts (not `Event`
 * counts) because attribution and de-duplication both live on `Visitor` —
 * see prisma/README.md for why.
 *
 * Called by GET /api/admin/metrics.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics[]> {
  const results = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const [sessions, purchases] = await Promise.all([
        prisma.visitor.count({
          where: { utmSource: platform },
        }),
        prisma.visitor.count({
          where: {
            utmSource: platform,
            events: { some: { type: 'purchase' } },
          },
        }),
      ])

      const conversionRate = sessions === 0 ? 0 : (purchases / sessions) * 100

      return { platform, sessions, purchases, conversionRate }
    })
  )

  return results
}

/**
 * Returns every recorded event (page_view + purchase), newest first, joined
 * with its visitor's attributed platform and (for purchases) the product
 * name. This is the raw feed the admin "event debugger" table renders.
 *
 * Called by GET /api/admin/events.
 */
export async function getEventDebugRows(): Promise<EventDebugRow[]> {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: { visitor: true, product: true },
  })

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    platform: (event.visitor.utmSource as EventDebugRow['platform']) ?? 'direct',
    productName: event.product?.name ?? null,
    url: event.url,
    createdAt: event.createdAt.toISOString(),
  }))
}
