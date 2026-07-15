import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance (avoids exhausting DB connections
// when this module is imported from many services/controllers).
const prisma = globalThis.__lmsPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.__lmsPrisma = prisma;

export default prisma;



//  typescript code  👇👇


// import { PrismaClient } from '@prisma/client';

// // Extend the global type
// declare global {
//   // eslint-disable-next-line no-var
//   var __lmsPrisma: ExtendedPrismaClient | undefined;
// }

// // Create a custom extended client
// class ExtendedPrismaClient extends PrismaClient {
//   constructor() {
//     super({
//       log: process.env.NODE_ENV === 'development' 
//         ? ['query', 'info', 'warn', 'error'] 
//         : ['error'],
//     });
//   }

//   // Add custom methods here
//   async findSoftDeleted<T>(model: string, id: string): Promise<T | null> {
//     // Custom logic for soft deletes
//     return this[model].findFirst({
//       where: {
//         id,
//         deletedAt: { not: null }
//       }
//     }) as Promise<T | null>;
//   }

//   // Add health check method
//   async healthCheck(): Promise<boolean> {
//     try {
//       await this.$queryRaw`SELECT 1`;
//       return true;
//     } catch (error) {
//       console.error('Health check failed:', error);
//       return false;
//     }
//   }
// }

// // Reuse a single PrismaClient instance
// const prisma: ExtendedPrismaClient = globalThis.__lmsPrisma ?? new ExtendedPrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//   globalThis.__lmsPrisma = prisma;
// }

// export default prisma;