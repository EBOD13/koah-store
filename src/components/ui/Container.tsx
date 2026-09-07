import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Centers content and caps its width — the single layout wrapper every page uses. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-5xl px-6', className)} {...props} />
}
