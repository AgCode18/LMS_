import prisma from '../lib/prisma.js';

export class BranchServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'BranchServiceError';
    this.status = status;
  }
}

export async function listBranches({ search, onlyActive } = {}) {
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(onlyActive !== undefined && { isActive: onlyActive }),
  };

  return prisma.branch.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function createBranch(data) {
  if (!data.name || !data.code) {
    throw new BranchServiceError('Branch name and code are required.');
  }

  return prisma.branch.create({
    data: {
      name: data.name.trim(),
      code: data.code.trim(),
      isActive: data.isActive !== false,
    },
  });
}





// typescript code  👇👇


// import { Request, Response } from 'express';
// import prisma from '../lib/prisma.js';
// import { Branch, Prisma } from '@prisma/client';

// // Error class with proper TypeScript types
// export class BranchServiceError extends Error {
//   public status: number;
  
//   constructor(message: string, status: number = 400) {
//     super(message);
//     this.name = 'BranchServiceError';
//     this.status = status;
    
//     // Maintains proper stack trace for where error was thrown
//     Object.setPrototypeOf(this, BranchServiceError.prototype);
//   }
// }

// // Type definitions for function parameters
// export interface ListBranchesParams {
//   search?: string;
//   onlyActive?: boolean;
// }

// export interface CreateBranchInput {
//   name: string;
//   code: string;
//   isActive?: boolean;
// }

// // Return type - Prisma's Branch type with possible relations
// export type BranchResponse = Branch;

// export async function listBranches(
//   { search, onlyActive }: ListBranchesParams = {}
// ): Promise<BranchResponse[]> {
//   const where: Prisma.BranchWhereInput = {
//     ...(search && {
//       OR: [
//         { name: { contains: search, mode: 'insensitive' } },
//         { code: { contains: search, mode: 'insensitive' } },
//       ],
//     }),
//     ...(onlyActive !== undefined && { isActive: onlyActive }),
//   };

//   return prisma.branch.findMany({
//     where,
//     orderBy: { name: 'asc' },
//   });
// }

// export async function createBranch(
//   data: CreateBranchInput
// ): Promise<BranchResponse> {
//   // Validate required fields
//   if (!data.name || !data.code) {
//     throw new BranchServiceError('Branch name and code are required.');
//   }

//   // Validate that name and code are strings (they should be, but let's be safe)
//   if (typeof data.name !== 'string' || typeof data.code !== 'string') {
//     throw new BranchServiceError('Branch name and code must be strings.');
//   }

//   return prisma.branch.create({
//     data: {
//       name: data.name.trim(),
//       code: data.code.trim(),
//       isActive: data.isActive !== false,
//     },
//   });
// }

// // Optional: Export a type for the service
// export interface BranchService {
//   listBranches: (params?: ListBranchesParams) => Promise<BranchResponse[]>;
//   createBranch: (data: CreateBranchInput) => Promise<BranchResponse>;
// }