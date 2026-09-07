import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** GET /api/products — the fake catalog rendered by the storefront home page. */
export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(products)
}
