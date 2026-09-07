import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import type { PlatformMetrics } from '@/types'

/**
 * The per-platform comparison table required by the "Metrics dashboard"
 * requirement: user sessions, purchases, and conversion rate for each of
 * google/koah/facebook. Pure presentational component — all the counting
 * happens in lib/metrics.ts, this just renders the numbers it's given.
 */
export function MetricsTable({ metrics }: { metrics: PlatformMetrics[] }) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Platform</Th>
          <Th className="text-right">User Sessions</Th>
          <Th className="text-right">Purchases</Th>
          <Th className="text-right">Conversion Rate</Th>
        </Tr>
      </Thead>
      <Tbody>
        {metrics.map((row) => (
          <Tr key={row.platform}>
            <Td>
              <Badge tone="accent" className="capitalize">
                {row.platform}
              </Badge>
            </Td>
            <Td className="text-right tabular-nums">{row.sessions}</Td>
            <Td className="text-right tabular-nums">{row.purchases}</Td>
            <Td className="text-right tabular-nums">{row.conversionRate.toFixed(1)}%</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}
