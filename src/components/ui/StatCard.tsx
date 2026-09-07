import type { ReactNode } from 'react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
}

/** A single metric tile: label + big value + optional icon. Used on the admin dashboard. */
export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </div>
      {icon && <div className="text-muted-foreground">{icon}</div>}
    </Card>
  )
}
