import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Returns the PrismaClient singleton or null if DATABASE_URL is not configured.
 * This prevents Lambda crash at import time when DATABASE_URL is pending setup.
 */
export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return global.__prisma;
}

// Proxy wrapper so existing code can import `prisma` normally
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    if (!client) {
      throw new Error(
        'DATABASE_URL is not configured in environment variables. Please add DATABASE_URL in Vercel Project Settings.'
      );
    }
    const val = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

export default prisma;
