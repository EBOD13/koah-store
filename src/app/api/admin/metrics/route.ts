import { NextResponse } from 'next/server'
import { getPlatformMetrics } from '@/lib/metrics'

/** GET /api/admin/metrics — per-platform sessions/purchases/conversion rate. */
export async function GET() {
  const metrics = await getPlatformMetrics()
  return NextResponse.json(metrics)
}
