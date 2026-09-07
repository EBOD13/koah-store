import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import type { EventDebugRow } from '@/types'

/**
 * The raw "event debugger" required by the spec: every page_view/purchase
 * ever recorded, with the platform it was attributed to, the product
 * bought (purchases only), and the page URL. Pure presentational
 * component — data comes from lib/metrics.ts's getEventDebugRows().
 */
export function EventsTable({ events }: { events: EventDebugRow[] }) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Time</Th>
          <Th>Type</Th>
          <Th>Platform</Th>
          <Th>Product</Th>
          <Th>Page URL</Th>
        </Tr>
      </Thead>
      <Tbody>
        {events.map((event) => (
          <Tr key={event.id}>
            <Td className="whitespace-nowrap text-muted-foreground">
              {new Date(event.createdAt).toLocaleString()}
            </Td>
            <Td>
              <Badge tone={event.type === 'purchase' ? 'success' : 'neutral'}>
                {event.type.replace('_', ' ')}
              </Badge>
            </Td>
            <Td>
              <Badge tone={event.platform === 'direct' ? 'neutral' : 'accent'} className="capitalize">
                {event.platform}
              </Badge>
            </Td>
            <Td>{event.productName ?? <span className="text-muted-foreground">—</span>}</Td>
            <Td className="max-w-xs truncate text-muted-foreground" title={event.url}>
              {event.url}
            </Td>
          </Tr>
        ))}
        {events.length === 0 && (
          <Tr>
            <Td colSpan={5} className="py-8 text-center text-muted-foreground">
              No events recorded yet — visit the storefront to generate some.
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  )
}
