import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance (avoids exhausting DB connections
// when this module is imported from many services/controllers).
const prisma = globalThis.__lmsPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.__lmsPrisma = prisma;

export default prisma;
