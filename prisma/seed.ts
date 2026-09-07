/**
 * Seeds the Product table with a fixed catalog of fake sports items.
 * Run with `npx prisma db seed` (wired up via package.json `prisma.seed`).
 * Safe to re-run: it clears existing products first.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  {
    name: 'Pulse Runner Sneakers',
    price: 8900,
    category: 'Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
  },
  {
    name: 'Trailblazer Hiking Boots',
    price: 12900,
    category: 'Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600',
  },
  {
    name: 'Court Classic Sneakers',
    price: 7500,
    category: 'Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
  },
  {
    name: 'DryFit Performance Tee',
    price: 3200,
    category: 'Shirts',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
  },
  {
    name: 'Team Spirit Jersey',
    price: 4500,
    category: 'Shirts',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600',
  },
  {
    name: 'Long Sleeve Thermal Top',
    price: 4200,
    category: 'Shirts',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600',
  },
  {
    name: 'Sprint Training Shorts',
    price: 2800,
    category: 'Shorts',
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600',
  },
  {
    name: 'Compression Base-Layer Shorts',
    price: 2600,
    category: 'Shorts',
    imageUrl: 'https://images.unsplash.com/photo-1506629905607-c28f3a3b3b0d?w=600',
  },
  {
    name: 'Adjustable Dumbbell Set',
    price: 15900,
    category: 'Workout Gear',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
  },
  {
    name: 'Pro Yoga Mat',
    price: 4900,
    category: 'Workout Gear',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600',
  },
  {
    name: 'Resistance Band Kit',
    price: 2200,
    category: 'Workout Gear',
    imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600',
  },
  {
    name: 'Insulated Sports Water Bottle',
    price: 1800,
    category: 'Workout Gear',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
  },
]

async function main() {
  await prisma.product.deleteMany()
  await prisma.product.createMany({ data: products })
  console.log(`Seeded ${products.length} products.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
