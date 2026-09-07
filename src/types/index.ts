/**
 * Shared types used across the client (tracking helpers, components) and the
 * server (API routes, metrics queries). Kept independent of Prisma's
 * generated types so client-side code doesn't need to import server-only code.
 */

/** The three ad platforms this system compares. Matches the `utm_source` values. */
export const PLATFORMS = ['google', 'koah', 'facebook'] as const
export type Platform = (typeof PLATFORMS)[number]

export type EventType = 'page_view' | 'purchase'

/** The UTM parameters captured from a landing page URL. */
export interface UtmParams {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
}

/** Body shape for POST /api/track. */
export interface TrackEventPayload {
  visitorId: string
  type: EventType
  url: string
  productId?: string | null
  utm?: UtmParams
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  imageUrl: string
}

/** One row of the admin metrics table, per platform. */
export interface PlatformMetrics {
  platform: Platform
  sessions: number
  purchases: number
  conversionRate: number
}

/** One row of the admin event debugger table. */
export interface EventDebugRow {
  id: string
  type: EventType
  platform: Platform | 'direct'
  productName: string | null
  url: string
  createdAt: string
}
