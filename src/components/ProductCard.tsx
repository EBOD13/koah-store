import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { BuyButton } from '@/components/BuyButton'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

/**
 * One product tile on the storefront grid. Renders a Buy Now button that
 * fires a `purchase` event via trackPurchase() and a link to the product's
 * own detail page — following that link (a different page than wherever the
 * visitor landed) and buying from there is exactly the scenario the
 * "attribution persistence" requirement is testing.
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/product/${product.id}`} className="block aspect-square overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
          <Link href={`/product/${product.id}`} className="font-medium leading-snug hover:underline">
            {product.name}
          </Link>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          <BuyButton productId={product.id} size="sm" />
        </div>
      </div>
    </Card>
  )
}
