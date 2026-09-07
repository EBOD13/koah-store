import { Users, ShoppingCart, TrendingUp } from 'lucide-react'
import { getPlatformMetrics, getEventDebugRows } from '@/lib/metrics'
import { Container } from '@/components/ui/Container'
import { StatCard } from '@/components/ui/StatCard'
import { MetricsTable } from '@/components/MetricsTable'
import { EventsTable } from '@/components/EventsTable'

export const dynamic = 'force-dynamic'

/**
 * The "Metrics dashboard" required by the spec. A Server Component that
 * calls the same lib/metrics.ts functions the /api/admin/* routes call —
 * see src/lib/README.md for why that logic lives in one shared module
 * instead of being duplicated between the page and the API. No auth, per
 * the spec ("no need to implement login").
 */
export default async function AdminPage() {
  const [metrics, events] = await Promise.all([getPlatformMetrics(), getEventDebugRows()])

  const totalSessions = metrics.reduce((sum, m) => sum + m.sessions, 0)
  const totalPurchases = metrics.reduce((sum, m) => sum + m.purchases, 0)
  const overallRate = totalSessions === 0 ? 0 : (totalPurchases / totalSessions) * 100

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Conversion Attribution</h1>
        <p className="mt-1 text-muted-foreground">
          Sessions and purchases attributed to each ad platform via first-touch UTM tracking.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Attributed Sessions" value={totalSessions} icon={<Users size={20} />} />
        <StatCard label="Total Purchases" value={totalPurchases} icon={<ShoppingCart size={20} />} />
        <StatCard
          label="Overall Conversion Rate"
          value={`${overallRate.toFixed(1)}%`}
          icon={<TrendingUp size={20} />}
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Metrics by Platform</h2>
        <MetricsTable metrics={metrics} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Event Debugger</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Raw log of every page view and purchase recorded, newest first.
        </p>
        <EventsTable events={events} />
      </section>
    </Container>
  )
}
