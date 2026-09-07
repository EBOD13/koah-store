import Link from 'next/link'
import { BarChart3, Dumbbell } from 'lucide-react'
import { Container } from '@/components/ui/Container'

/** Site-wide nav bar: storefront logo/home link + the admin dashboard link. */
export function Header() {
  return (
    <header className="border-b border-border">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Dumbbell size={20} className="text-accent" />
          Koah Store
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <BarChart3 size={16} />
          Admin
        </Link>
      </Container>
    </header>
  )
}
