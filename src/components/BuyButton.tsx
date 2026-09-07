'use client'

import { useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { Button, type ButtonSize } from '@/components/ui/Button'
import { trackPurchase } from '@/lib/tracking'

/**
 * The one "Buy Now" control in the app — used by both the storefront grid
 * (ProductCard) and the product detail page, so there's exactly one place
 * that calls trackPurchase(). Clicking it doesn't process a real payment; it
 * just records a `purchase` event for the current visitor and product.
 */
export function BuyButton({ productId, size = 'md' }: { productId: string; size?: ButtonSize }) {
  const [purchased, setPurchased] = useState(false)

  function handleBuy() {
    trackPurchase(productId, window.location.pathname + window.location.search)
    setPurchased(true)
    setTimeout(() => setPurchased(false), 2000)
  }

  return (
    <Button size={size} onClick={handleBuy} disabled={purchased}>
      {purchased ? (
        <>
          <Check size={16} /> Added
        </>
      ) : (
        <>
          <ShoppingBag size={16} /> Buy Now
        </>
      )}
    </Button>
  )
}
