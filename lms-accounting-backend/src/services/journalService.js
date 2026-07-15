import prisma from '../lib/prisma.js';
import { nextVoucherNumber } from '../utils/voucherNumber.js';
import { applyMovement } from './accountService.js';

export class JournalServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'JournalServiceError';
    this.status = status;
  }
}

const EPSILON = 0.005; // half a paisa/cent tolerance for float rounding

/**
 * The single entry point every accounting event in the LMS goes through.
 * Mirrors the PDF's `createJournal("narration", [[accountKeyOrId, debit, credit], ...])`
 * trigger, but resolves accounts, generates the voucher number, posts the
 * entry and updates account balances atomically in one DB transaction.
 */
export async function createJournal({
  narration,
  referenceType,
  referenceId,
  lines,
  transactionDate = new Date(),
  createdById,
  status = 'POSTED',
  loanDisbursementId,
}) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new JournalServiceError('A journal entry needs at least two lines (one debit, one credit)');
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (!line.accountId) throw new JournalServiceError('Every journal line needs an accountId');
    totalDebit += Number(line.debit ?? 0);
    totalCredit += Number(line.credit ?? 0);
  }

  if (Math.abs(totalDebit - totalCredit) > EPSILON) {
    throw new JournalServiceError(
      `Journal entry is not balanced: total debit ${totalDebit.toFixed(2)} !== total credit ${totalCredit.toFixed(2)}`
    );
  }
  if (totalDebit === 0) {
    throw new JournalServiceError('Journal entry cannot have a zero amount');
  }

  return prisma.$transaction(async (tx) => {
    const voucherNo = await nextVoucherNumber(tx, transactionDate);

    const entry = await tx.journalEntry.create({
      data: {
        voucherNo,
        voucherType: 'JOURNAL',
        transactionDate,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        narration: narration ?? null,
        totalDebit,
        totalCredit,
        status,
        postedAt: status === 'POSTED' ? new Date() : null,
        createdById: createdById ?? null,
        loanDisbursementId: loanDisbursementId ?? null,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: Number(l.debit ?? 0),
            credit: Number(l.credit ?? 0),
            description: l.description ?? null,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    // Only posted entries move account balances; a DRAFT sits inert until posted.
    if (status === 'POSTED') {
      for (const line of lines) {
        await applyMovement(tx, line.accountId, Number(line.debit ?? 0), Number(line.credit ?? 0));
      }
    }

    return entry;
  });
}

export async function postDraft(id) {
  const entry = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: true } });
  if (!entry) throw new JournalServiceError('Journal entry not found', 404);
  if (entry.status !== 'DRAFT') throw new JournalServiceError(`Only DRAFT entries can be posted (this is ${entry.status})`);

  return prisma.$transaction(async (tx) => {
    for (const line of entry.lines) {
      await applyMovement(tx, line.accountId, line.debit, line.credit);
    }
    return tx.journalEntry.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date() },
      include: { lines: { include: { account: true } } },
    });
  });
}

export async function cancelJournal(id) {
  const entry = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: true } });
  if (!entry) throw new JournalServiceError('Journal entry not found', 404);
  if (entry.status === 'CANCELLED') throw new JournalServiceError('Journal entry is already cancelled');

  return prisma.$transaction(async (tx) => {
    // Reverse the balance impact only if it had been posted.
    if (entry.status === 'POSTED') {
      for (const line of entry.lines) {
        // Swap debit/credit to reverse the effect on currentBalance.
        await applyMovement(tx, line.accountId, line.credit, line.debit);
      }
    }
    return tx.journalEntry.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { lines: { include: { account: true } } },
    });
  });
}

export async function listJournalEntries({ referenceType, status, from, to, accountSearch, page = 1, pageSize = 25 } = {}) {
  const where = {
    ...(referenceType && { referenceType }),
    ...(status && { status }),
    ...((from || to) && {
      transactionDate: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
    ...(accountSearch && { lines: { some: { account: { name: { contains: accountSearch } } } } }),
  };

  const [total, data] = await Promise.all([
    prisma.journalEntry.count({ where }),
    prisma.journalEntry.findMany({
      where,
      include: { lines: { include: { account: true } } },
      orderBy: { transactionDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, page, pageSize, data };
}

export async function getJournalEntry(id) {
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: { lines: { include: { account: true } } },
  });
  if (!entry) throw new JournalServiceError('Journal entry not found', 404);
  return entry;
}





// typescript code  👇👇




// import { Prisma } from "@prisma/client";
// import prisma from '../lib/prisma.js';
// import { nextVoucherNumber } from '../utils/voucherNumber.js';
// import { applyMovement } from './accountService.js';

// export class JournalServiceError extends Error {
//   public status: number;
  
//   constructor(message: string, status: number = 400) {
//     super(message);
//     this.name = 'JournalServiceError';
//     this.status = status;
//     Object.setPrototypeOf(this, JournalServiceError.prototype);
//   }
// }

// const EPSILON = 0.005;

// type JournalStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
// type JournalLineInput = {
//   accountId: string;
//   debit?: number;
//   credit?: number;
//   description?: string | null;
// };

// type CreateJournalInput = {
//   narration?: string | null;
//   referenceType?: string | null;
//   referenceId?: string | null;
//   lines: JournalLineInput[];
//   transactionDate?: Date;
//   createdById?: string | null;
//   status?: JournalStatus;
//   loanDisbursementId?: string | null;
// };

// export async function createJournal({
//   narration,
//   referenceType,
//   referenceId,
//   lines,
//   transactionDate = new Date(),
//   createdById,
//   status = 'POSTED',
//   loanDisbursementId,
// }: CreateJournalInput) {
//   if (!Array.isArray(lines) || lines.length < 2) {
//     throw new JournalServiceError('A journal entry needs at least two lines (one debit, one credit)');
//   }

//   let totalDebit = 0;
//   let totalCredit = 0;
//   for (const line of lines) {
//     if (!line.accountId) throw new JournalServiceError('Every journal line needs an accountId');
//     totalDebit += Number(line.debit ?? 0);
//     totalCredit += Number(line.credit ?? 0);
//   }

//   if (Math.abs(totalDebit - totalCredit) > EPSILON) {
//     throw new JournalServiceError(
//       `Journal entry is not balanced: total debit ${totalDebit.toFixed(2)} !== total credit ${totalCredit.toFixed(2)}`
//     );
//   }
//   if (totalDebit === 0) {
//     throw new JournalServiceError('Journal entry cannot have a zero amount');
//   }

//   return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
//     const voucherNo = await nextVoucherNumber(tx, transactionDate);

//     const entry = await tx.journalEntry.create({
//       data: {
//         voucherNo,
//         voucherType: 'JOURNAL',
//         transactionDate,
//         referenceType: referenceType ?? null,
//         referenceId: referenceId ?? null,
//         narration: narration ?? null,
//         totalDebit,
//         totalCredit,
//         status,
//         postedAt: status === 'POSTED' ? new Date() : null,
//         createdById: createdById ?? null,
//         loanDisbursementId: loanDisbursementId ?? null,
//         lines: {
//           create: lines.map((l) => ({
//             accountId: l.accountId,
//             debit: Number(l.debit ?? 0),
//             credit: Number(l.credit ?? 0),
//             description: l.description ?? null,
//           })),
//         },
//       },
//       include: { lines: { include: { account: true } } },
//     });

//     if (status === 'POSTED') {
//       for (const line of lines) {
//         await applyMovement(tx, line.accountId, Number(line.debit ?? 0), Number(line.credit ?? 0));
//       }
//     }

//     return entry;
//   });
// }
