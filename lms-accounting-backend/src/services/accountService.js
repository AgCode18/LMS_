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
