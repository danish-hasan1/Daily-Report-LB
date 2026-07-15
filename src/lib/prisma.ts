import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// At runtime, prefer the POOLED connection string — it's the right choice for
// serverless (many short-lived connections). Fall back to the direct/unpooled
// ones so the app still works if only those are configured.
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  throw new Error(
    "No database connection string found. Set DATABASE_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL) in your environment."
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
