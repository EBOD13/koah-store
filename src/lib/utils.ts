/** Joins conditional class names, skipping falsy values. Used by every ui primitive. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Formats a price stored in cents as e.g. "$89.00". */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
