import { prisma } from '@/lib/db'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/ProductCard'

// Always read the current product list from the database rather than
// letting Next.js cache/prerender this page.
export const dynamic = 'force-dynamic'

/**
 * Storefront home page. A Server Component that queries Postgres directly
 * (no need to round-trip through /api/products, which exists as a public
 * endpoint but isn't used by this page — see src/app/README.md). The actual
 * "did this visitor come from an ad" tracking happens client-side in
 * <TrackingProvider>, mounted once in the root layout, not here.
 */
export default async function HomePage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Gear up.</h1>
        <p className="mt-1 text-muted-foreground">
          Shoes, apparel, and equipment for every workout.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  )
}
