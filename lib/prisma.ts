import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL || '';

function getPrismaClient() {
  if (databaseUrl.startsWith('prisma+postgres://')) {
    // Accelerate client uses the prisma+postgres URL directly and the accelerate extension
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    }).$extends(withAccelerate());
  } else {
    // Standard direct connection uses pg.Pool and @prisma/adapter-pg driver adapter
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
}

// Global caching for hot reloading in development
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof getPrismaClient> | undefined;
};

export const prisma = (globalForPrisma.prisma ?? getPrismaClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as ReturnType<typeof getPrismaClient>;
}
