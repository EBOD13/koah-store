'use client'

import type { EventType, TrackEventPayload, UtmParams } from '@/types'

const VISITOR_COOKIE = 'koah_visitor_id'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // 180 days, matching GA's default campaign window

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

/**
 * Reads the `koah_visitor_id` cookie, or creates one if this browser has
 * never been seen before. This id is the sole identity for a "visitor" /
 * "user session" throughout this whole system — it's what lets attribution
 * and every subsequent event survive page reloads and navigation to other
 * pages in the same tab (and, as a bonus, across future tabs/visits too,
 * since it's a real cookie rather than sessionStorage).
 */
export function getOrCreateVisitorId(): string {
  const existing = readCookie(VISITOR_COOKIE)
  if (existing) return existing

  const id = crypto.randomUUID()
  writeCookie(VISITOR_COOKIE, id, COOKIE_MAX_AGE_SECONDS)
  return id
}

/** Extracts the five standard UTM parameters from a URLSearchParams instance. */
export function parseUtmParams(searchParams: URLSearchParams): UtmParams {
  return {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_term: searchParams.get('utm_term'),
    utm_content: searchParams.get('utm_content'),
  }
}

async function postEvent(payload: TrackEventPayload) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // Tracking must never break the shopping experience — swallow network errors.
  }
}

/** Fired once per route change by <TrackingProvider>. */
export function trackPageView(url: string, utm: UtmParams) {
  const visitorId = getOrCreateVisitorId()
  void postEvent({ visitorId, type: 'page_view' as EventType, url, utm })
}

/** Fired by a product's "Buy Now" button. */
export function trackPurchase(productId: string, url: string) {
  const visitorId = getOrCreateVisitorId()
  void postEvent({ visitorId, type: 'purchase' as EventType, url, productId })
}
