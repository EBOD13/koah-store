'use client'

import { Suspense, useEffect, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getOrCreateVisitorId, parseUtmParams, trackPageView } from '@/lib/tracking'

/**
 * Fires one page_view event per route change. Split out from
 * <TrackingProvider> because `useSearchParams` requires a Suspense boundary
 * around whatever reads it (see Next.js docs) — everything else in
 * `layout.tsx` renders immediately, only this invisible tracker suspends.
 */
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    getOrCreateVisitorId()
    const utm = parseUtmParams(searchParams)
    const query = searchParams.toString()
    const url = query ? `${pathname}?${query}` : pathname
    trackPageView(url, utm)
    // Re-run on every route change (path or query), which is exactly what
    // "visited another page" means for this system.
  }, [pathname, searchParams])

  return null
}

/**
 * Mounted once in the root layout (src/app/layout.tsx). Owns nothing visual —
 * its only job is to make sure `PageViewTracker` runs on every navigation,
 * for every page in the app, without every page having to remember to call
 * trackPageView itself.
 */
export function TrackingProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  )
}
