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





// import prisma from '../lib/prisma.js';
// import { Branch, Prisma } from '@prisma/client';

// // ============================================================================
// // Type Definitions
// // ============================================================================

// export interface BranchListOptions {
//   search?: string;
//   onlyActive?: boolean;
// }

// export interface BranchCreateInput {
//   name: string;
//   code: string;
//   isActive?: boolean;
// }

// export interface BranchUpdateInput {
//   name?: string;
//   code?: string;
//   isActive?: boolean;
// }

// // ============================================================================
// // Error Class
// // ============================================================================

// export class BranchServiceError extends Error {
//   public readonly status: number;
  
//   constructor(message: string, status: number = 400) {
//     super(message);
//     this.name = 'BranchServiceError';
//     this.status = status;
//   }
// }

// // ============================================================================
// // Service Functions
// // ============================================================================

// export async function listBranches(options: BranchListOptions = {}): Promise<Branch[]> {
//   const { search, onlyActive } = options;
  
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

// export async function createBranch(data: BranchCreateInput): Promise<Branch> {
//   if (!data.name || !data.code) {
//     throw new BranchServiceError('Branch name and code are required.');
//   }

//   // Check for duplicate branch name or code
//   const existingBranch = await prisma.branch.findFirst({
//     where: {
//       OR: [
//         { name: data.name.trim() },
//         { code: data.code.trim() },
//       ],
//     },
//   });

//   if (existingBranch) {
//     if (existingBranch.name === data.name.trim()) {
//       throw new BranchServiceError('Branch name already exists. Please choose a different name.', 409);
//     }
//     if (existingBranch.code === data.code.trim()) {
//       throw new BranchServiceError('Branch code already exists. Please choose a different code.', 409);
//     }
//   }

//   return prisma.branch.create({
//     data: {
//       name: data.name.trim(),
//       code: data.code.trim(),
//       isActive: data.isActive !== false,
//     },
//   });
// }

// // ============================================================================
// // Additional Utility Functions
// // ============================================================================

// export async function getBranchById(id: string): Promise<Branch> {
//   const branch = await prisma.branch.findUnique({
//     where: { id },
//   });
  
//   if (!branch) {
//     throw new BranchServiceError('Branch not found', 404);
//   }
  
//   return branch;
// }

// export async function getBranchByCode(code: string): Promise<Branch | null> {
//   return prisma.branch.findUnique({
//     where: { code },
//   });
// }

// export async function updateBranch(
//   id: string,
//   data: BranchUpdateInput
// ): Promise<Branch> {
//   // Check if branch exists
//   await getBranchById(id);

//   // Check for duplicate name or code if being updated
//   if (data.name || data.code) {
//     const existingBranch = await prisma.branch.findFirst({
//       where: {
//         AND: [
//           { id: { not: id } },
//           {
//             OR: [
//               ...(data.name ? [{ name: data.name.trim() }] : []),
//               ...(data.code ? [{ code: data.code.trim() }] : []),
//             ],
//           },
//         ],
//       },
//     });

//     if (existingBranch) {
//       if (data.name && existingBranch.name === data.name.trim()) {
//         throw new BranchServiceError('Branch name already exists. Please choose a different name.', 409);
//       }
//       if (data.code && existingBranch.code === data.code.trim()) {
//         throw new BranchServiceError('Branch code already exists. Please choose a different code.', 409);
//       }
//     }
//   }

//   const updateData: Prisma.BranchUpdateInput = {};
  
//   if (data.name !== undefined) updateData.name = data.name.trim();
//   if (data.code !== undefined) updateData.code = data.code.trim();
//   if (data.isActive !== undefined) updateData.isActive = data.isActive;

//   return prisma.branch.update({
//     where: { id },
//     data: updateData,
//   });
// }

// export async function deleteBranch(id: string): Promise<Branch> {
//   // Check if branch exists
//   await getBranchById(id);

//   // Check if branch has any related records (e.g., loans, users, etc.)
//   // Add your business logic here to prevent deletion if there are dependencies
  
//   return prisma.branch.delete({
//     where: { id },
//   });
// }

// export async function toggleBranchStatus(id: string, isActive: boolean): Promise<Branch> {
//   return updateBranch(id, { isActive });
// }

// export async function getActiveBranches(): Promise<Branch[]> {
//   return prisma.branch.findMany({
//     where: { isActive: true },
//     orderBy: { name: 'asc' },
//   });
// }

// export async function searchBranches(searchTerm: string): Promise<Branch[]> {
//   return prisma.branch.findMany({
//     where: {
//       OR: [
//         { name: { contains: searchTerm, mode: 'insensitive' } },
//         { code: { contains: searchTerm, mode: 'insensitive' } },
//       ],
//     },
//     orderBy: { name: 'asc' },
//   });
// }

// // ============================================================================
// // Validation Functions
// // ============================================================================

// export function validateBranchCreateInput(data: BranchCreateInput): void {
//   if (!data.name) {
//     throw new BranchServiceError('Branch name is required.', 400);
//   }
  
//   if (!data.code) {
//     throw new BranchServiceError('Branch code is required.', 400);
//   }
  
//   if (data.name && data.name.trim().length < 2) {
//     throw new BranchServiceError('Branch name must be at least 2 characters long.', 400);
//   }
  
//   if (data.code && data.code.trim().length < 2) {
//     throw new BranchServiceError('Branch code must be at least 2 characters long.', 400);
//   }
// }

// export function validateBranchUpdateInput(data: BranchUpdateInput): void {
//   if (data.name && data.name.trim().length < 2) {
//     throw new BranchServiceError('Branch name must be at least 2 characters long.', 400);
//   }
  
//   if (data.code && data.code.trim().length < 2) {
//     throw new BranchServiceError('Branch code must be at least 2 characters long.', 400);
//   }
// }

// // ============================================================================
// // Bulk Operations
// // ============================================================================

// export async function createBranches(branches: BranchCreateInput[]): Promise<Branch[]> {
//   if (!branches || branches.length === 0) {
//     throw new BranchServiceError('No branches provided for bulk creation.', 400);
//   }

//   const results: Branch[] = [];
//   const errors: Array<{ index: number; error: string }> = [];

//   for (let i = 0; i < branches.length; i++) {
//     try {
//       const branch = await createBranch(branches[i]);
//       results.push(branch);
//     } catch (error) {
//       errors.push({
//         index: i,
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   if (errors.length > 0) {
//     throw new BranchServiceError(
//       `Bulk creation completed with ${errors.length} errors.`,
//       400
//     );
//   }

//   return results;
// }

// export async function deleteBranches(ids: string[]): Promise<number> {
//   if (!ids || ids.length === 0) {
//     throw new BranchServiceError('No branch IDs provided for bulk deletion.', 400);
//   }

//   const result = await prisma.branch.deleteMany({
//     where: {
//       id: { in: ids },
//     },
//   });

//   return result.count;
// }