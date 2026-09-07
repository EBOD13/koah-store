import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton. Next.js reloads route modules on every change in
 * dev mode, which would otherwise create a fresh PrismaClient (and a fresh
 * connection pool) per reload. Stashing it on `globalThis` survives those
 * reloads; in production a single instance is created per server process.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
