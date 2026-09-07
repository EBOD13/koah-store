import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { Container } from '@/components/ui/Container'
import { BuyButton } from '@/components/BuyButton'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * Product detail page — deliberately a *different* URL/page than the
 * storefront home. A visitor who lands on `/?utm_source=google`, clicks
 * into a product here, and buys from this page (no utm_source anywhere in
 * this URL) is exactly the scenario the "attribution persistence"
 * requirement describes: the purchase must still be attributed back to the
 * `koah_visitor_id` cookie's first-touch UTM values, not to this page's URL.
 */
export default async function ProductPage({ params }: PageProps<'/product/[id]'>) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  return (
    <Container className="py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to all products
      </Link>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-xl font-semibold">{formatPrice(product.price)}</p>
          <p className="mt-4 max-w-prose text-muted-foreground">
            Built for training days and everything after. Breathable, durable, and ready for
            whatever your workout throws at it.
          </p>
          <div className="mt-6">
            <BuyButton productId={product.id} />
          </div>
        </div>
      </div>
    </Container>
  )
}
