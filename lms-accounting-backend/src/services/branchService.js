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
