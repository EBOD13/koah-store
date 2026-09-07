import { NextResponse } from 'next/server'
import { getEventDebugRows } from '@/lib/metrics'

/** GET /api/admin/events — raw page_view/purchase log for the event debugger. */
export async function GET() {
  const events = await getEventDebugRows()
  return NextResponse.json(events)
}
