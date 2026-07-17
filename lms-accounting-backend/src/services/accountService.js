import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

export class AccountServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AccountServiceError";
    this.status = status;
  }
}

/** Normal balance side per account type — decides whether a debit or a
 * credit line INCREASES an account's currentBalance. This is standard
 * double-entry accounting, not something specific to loans. */
const DEBIT_NORMAL_TYPES = new Set(["ASSET", "EXPENSE"]);

export const isDebitNormal = (accountType) =>
  DEBIT_NORMAL_TYPES.has(accountType);

/** ASSET codes start 1xxx, LIABILITY 2xxx, EQUITY 3xxx, INCOME 4xxx, EXPENSE 5xxx —
 * matches the PDF's sample Chart of Accounts numbering convention. */

const TYPE_PREFIX = {
  ASSET: 1,
  LIABILITY: 2,
  EQUITY: 3,
  INCOME: 4,
  EXPENSE: 5,
};

export async function generateNextCode(type) {
  const prefix = TYPE_PREFIX[type];
  if (!prefix)
    throw new AccountServiceError(
      `Cannot auto-generate a code for unknown account type "${type}"`,
    );

  const candidates = await prisma.account.findMany({
    where: { code: { startsWith: String(prefix) } },
    select: { code: true },
  });

  const nums = candidates
    .map(({ code }) => Number(code))
    .filter((n) => Number.isFinite(n) && Math.floor(n / 1000) === prefix);

  const next = nums.length ? Math.max(...nums) + 1 : prefix * 1000 + 1;
  return String(next);
}

export async function listAccounts({
  type,
  status,
  search,
  page,
  pageSize,
} = {}) {
  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(search && {
      OR: [{ name: { contains: search } }, { code: { contains: search } }],
    }),
  };

  // Plain (non-paginated) call — used by the Chart of Accounts tree view.
  if (!page && !pageSize) {
    return prisma.account.findMany({ where, orderBy: { code: "asc" } });
  }

  const take = pageSize ?? 20;
  const skip = ((page ?? 1) - 1) * take;

  const [total, data] = await Promise.all([
    prisma.account.count({ where }),
    prisma.account.findMany({ where, orderBy: { code: "asc" }, skip, take }),
  ]);

  return { total, page: page ?? 1, pageSize: take, data };
}

/** Returns the Chart of Accounts as a parent -> children tree. */
export async function getAccountTree() {
  const all = await prisma.account.findMany({ orderBy: { code: "asc" } });
  const byId = new Map(all.map((a) => [a.id, { ...a, children: [] }]));
  const roots = [];

  for (const acc of byId.values()) {
    if (acc.parentAccountId && byId.has(acc.parentAccountId)) {
      byId.get(acc.parentAccountId).children.push(acc);
    } else {
      roots.push(acc);
    }
  }

  return roots;
}

export async function getAccountById(id) {
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) throw new AccountServiceError("Account not found", 404);
  return account;
}

export async function getBySystemKey(systemKey, tx = prisma) {
  const account = await tx.account.findUnique({ where: { systemKey } });
  if (!account) {
    throw new AccountServiceError(
      `Required system account "${systemKey}" is not configured. Run the seed script or create it in the Chart of Accounts first.`,
      500,
    );
  }
  return account;
}

export async function createAccount(data) {
  if (!data.name || !data.type) {
    throw new AccountServiceError("Account Code and Name should unique.");
  }

  const code = data.code?.trim()
    ? data.code.trim()
    : await generateNextCode(data.type);

  try {
    return await prisma.account.create({
      data: {
        code,
        name: data.name,
        type: data.type,
        systemKey: data.systemKey ?? null,
        parentAccountId: data.parentAccountId ?? null,
        openingBalance: data.openingBalance ?? 0,
        currentBalance: data.openingBalance ?? 0,
        description: data.description ?? null,
      },
    });
  } catch (error) {
    // Duplicate Code/Name
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;

      if (target?.includes("accounts_code_key")) {
        throw new AccountServiceError(
          "Account code already exists. Please choose a different code.",
          409,
        );
      }

      if (target?.includes("accounts_name_key")) {
        throw new AccountServiceError(
          "Account name already exists. Please choose a different name.",
          409,
        );
      }

      throw new AccountServiceError(
        "A record with the same information already exists.",
        409,
      );
    }

    throw error;
  }
}

export async function updateAccount(id, data) {
  await getAccountById(id);
  return prisma.account.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.parentAccountId !== undefined && {
        parentAccountId: data.parentAccountId,
      }),
    },
  });
}

/** Applies a debit/credit movement to an account's running balance. Must
 * be called inside the same transaction as the journal line insert. */

export async function applyMovement(tx, accountId, debit, credit) {
  const account = await tx.account.findUnique({ where: { id: accountId } });
  if (!account)
    throw new AccountServiceError(`Account ${accountId} not found`, 404);

  const signedDelta = isDebitNormal(account.type)
    ? debit - credit
    : credit - debit;

  return tx.account.update({
    where: { id: accountId },
    data: { currentBalance: { increment: signedDelta } },
  });
}



// typscript code 👇👇


// import { Prisma, PrismaClient, Account, AccountType, AccountStatus } from "@prisma/client";
// import prisma from "../lib/prisma.js";

// // ============================================================================
// // Error Class
// // ============================================================================

// export class AccountServiceError extends Error {
//   status: number;

//   constructor(message: string, status: number = 400) {
//     super(message);
//     this.name = "AccountServiceError";
//     this.status = status;
//   }
// }

// // ============================================================================
// // Types
// // ============================================================================

// export interface ListAccountsOptions {
//   type?: AccountType;
//   status?: AccountStatus;
//   search?: string;
//   page?: number;
//   pageSize?: number;
// }

// export interface CreateAccountInput {
//   code?: string;
//   name: string;
//   type: AccountType;
//   systemKey?: string | null;
//   parentAccountId?: string | null;
//   openingBalance?: number;
//   description?: string | null;
// }

// export interface UpdateAccountInput {
//   name?: string;
//   description?: string | null;
//   status?: AccountStatus;
//   parentAccountId?: string | null;
// }

// // ============================================================================
// // Constants
// // ============================================================================

// const DEBIT_NORMAL_TYPES = new Set<AccountType>([
//   "ASSET",
//   "EXPENSE",
// ]);

// export const isDebitNormal = (accountType: AccountType): boolean =>
//   DEBIT_NORMAL_TYPES.has(accountType);

// const TYPE_PREFIX: Record<AccountType, number> = {
//   ASSET: 1,
//   LIABILITY: 2,
//   EQUITY: 3,
//   INCOME: 4,
//   EXPENSE: 5,
// };

// // ============================================================================
// // Generate Next Account Code
// // ============================================================================

// export async function generateNextCode(
//   type: AccountType
// ): Promise<string> {
//   const prefix = TYPE_PREFIX[type];

//   if (!prefix) {
//     throw new AccountServiceError(
//       `Cannot auto-generate a code for unknown account type "${type}"`
//     );
//   }

//   const candidates = await prisma.account.findMany({
//     where: {
//       code: {
//         startsWith: String(prefix),
//       },
//     },
//     select: {
//       code: true,
//     },
//   });

//   const nums = candidates
//     .map(({ code }) => Number(code))
//     .filter(
//       (n) => Number.isFinite(n) && Math.floor(n / 1000) === prefix
//     );

//   const next = nums.length
//     ? Math.max(...nums) + 1
//     : prefix * 1000 + 1;

//   return String(next);
// }

// // ============================================================================
// // List Accounts
// // ============================================================================

// export async function listAccounts(
//   {
//     type,
//     status,
//     search,
//     page,
//     pageSize,
//   }: ListAccountsOptions = {}
// ): Promise<
//   Account[] | {
//     total: number;
//     page: number;
//     pageSize: number;
//     data: Account[];
//   }
// > {
//   const where: Prisma.AccountWhereInput = {
//     ...(type && { type }),
//     ...(status && { status }),
//     ...(search && {
//       OR: [
//         {
//           name: {
//             contains: search,
//             mode: "insensitive",
//           },
//         },
//         {
//           code: {
//             contains: search,
//           },
//         },
//       ],
//     }),
//   };

//   if (!page && !pageSize) {
//     return prisma.account.findMany({
//       where,
//       orderBy: {
//         code: "asc",
//       },
//     });
//   }

//   const take = pageSize ?? 20;
//   const skip = ((page ?? 1) - 1) * take;

//   const [total, data] = await Promise.all([
//     prisma.account.count({ where }),
//     prisma.account.findMany({
//       where,
//       orderBy: {
//         code: "asc",
//       },
//       skip,
//       take,
//     }),
//   ]);

//   return {
//     total,
//     page: page ?? 1,
//     pageSize: take,
//     data,
//   };
// }

// // ============================================================================
// // Account Tree
// // ============================================================================

// export async function getAccountTree(): Promise<any[]> {
//   const all = await prisma.account.findMany({
//     orderBy: {
//       code: "asc",
//     },
//   });

//   const byId = new Map<string, any>(
//     all.map((account) => [
//       account.id,
//       {
//         ...account,
//         children: [],
//       },
//     ])
//   );

//   const roots: any[] = [];

//   for (const account of byId.values()) {
//     if (
//       account.parentAccountId &&
//       byId.has(account.parentAccountId)
//     ) {
//       byId.get(account.parentAccountId).children.push(account);
//     } else {
//       roots.push(account);
//     }
//   }

//   return roots;
// }

// // ============================================================================
// // Get Account By ID
// // ============================================================================

// export async function getAccountById(
//   id: string
// ): Promise<Account> {
//   const account = await prisma.account.findUnique({
//     where: { id },
//   });

//   if (!account) {
//     throw new AccountServiceError("Account not found", 404);
//   }

//   return account;
// }

// // ============================================================================
// // Get System Account
// // ============================================================================

// export async function getBySystemKey(
//   systemKey: string,
//   tx: Prisma.TransactionClient | PrismaClient = prisma
// ): Promise<Account> {
//   const account = await tx.account.findUnique({
//     where: {
//       systemKey,
//     },
//   });

//   if (!account) {
//     throw new AccountServiceError(
//       `Required system account "${systemKey}" is not configured. Run the seed script or create it first.`,
//       500
//     );
//   }

//   return account;
// }

// // ============================================================================
// // Create Account
// // ============================================================================

// export async function createAccount(
//   data: CreateAccountInput
// ): Promise<Account> {
//   if (!data.name || !data.type) {
//     throw new AccountServiceError(
//       "Account Code and Name should be unique."
//     );
//   }

//   const code =
//     data.code?.trim() ||
//     (await generateNextCode(data.type));

//   try {
//     return await prisma.account.create({
//       data: {
//         code,
//         name: data.name,
//         type: data.type,
//         systemKey: data.systemKey ?? null,
//         parentAccountId: data.parentAccountId ?? null,
//         openingBalance: data.openingBalance ?? 0,
//         currentBalance: data.openingBalance ?? 0,
//         description: data.description ?? null,
//       },
//     });
//   } catch (error) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2002"
//     ) {
//       const target = error.meta?.target;

//       if (
//         Array.isArray(target) &&
//         target.includes("code")
//       ) {
//         throw new AccountServiceError(
//           "Account code already exists.",
//           409
//         );
//       }

//       if (
//         Array.isArray(target) &&
//         target.includes("name")
//       ) {
//         throw new AccountServiceError(
//           "Account name already exists.",
//           409
//         );
//       }

//       throw new AccountServiceError(
//         "Duplicate record found.",
//         409
//       );
//     }

//     throw error;
//   }
// }

// // ============================================================================
// // Update Account
// // ============================================================================

// export async function updateAccount(
//   id: string,
//   data: UpdateAccountInput
// ): Promise<Account> {
//   await getAccountById(id);

//   return prisma.account.update({
//     where: {
//       id,
//     },
//     data: {
//       ...(data.name !== undefined && {
//         name: data.name,
//       }),
//       ...(data.description !== undefined && {
//         description: data.description,
//       }),
//       ...(data.status !== undefined && {
//         status: data.status,
//       }),
//       ...(data.parentAccountId !== undefined && {
//         parentAccountId: data.parentAccountId,
//       }),
//     },
//   });
// }

// // ============================================================================
// // Apply Journal Movement
// // ============================================================================

// export async function applyMovement(
//   tx: Prisma.TransactionClient,
//   accountId: string,
//   debit: number,
//   credit: number
// ): Promise<Account> {
//   const account = await tx.account.findUnique({
//     where: {
//       id: accountId,
//     },
//   });

//   if (!account) {
//     throw new AccountServiceError(
//       `Account ${accountId} not found`,
//       404
//     );
//   }

//   const signedDelta = isDebitNormal(account.type)
//     ? debit - credit
//     : credit - debit;

//   return tx.account.update({
//     where: {
//       id: accountId,
//     },
//     data: {
//       currentBalance: {
//         increment: signedDelta,
//       },
//     },
//   });
// }