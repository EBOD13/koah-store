import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** A plain surface: card background, subtle border, rounded corners. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card text-card-foreground', className)}
      {...props}
    />
  )
}
