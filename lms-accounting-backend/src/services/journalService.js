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

// import prisma from '../lib/prisma.js';
// import { nextVoucherNumber } from '../utils/voucherNumber.js';
// import { applyMovement } from './accountService.js';
// import { Prisma, JournalEntry, JournalEntryLine, Account } from '@prisma/client';

// // ============================================================================
// // Type Definitions
// // ============================================================================

// export interface JournalLineInput {
//   accountId: string;
//   debit?: number;
//   credit?: number;
//   description?: string | null;
// }

// export interface JournalCreateInput {
//   narration?: string;
//   referenceType?: string | null;
//   referenceId?: string | null;
//   lines: JournalLineInput[];
//   transactionDate?: Date | string;
//   createdById?: string | null;
//   status?: 'DRAFT' | 'POSTED' | 'CANCELLED';
//   loanDisbursementId?: string | null;
// }

// export interface JournalListOptions {
//   referenceType?: string;
//   status?: string;
//   from?: string | Date;
//   to?: string | Date;
//   accountSearch?: string;
//   page?: number;
//   pageSize?: number;
// }

// export interface JournalEntryWithLines extends JournalEntry {
//   lines: (JournalEntryLine & {
//     account: Account;
//   })[];
// }

// // ============================================================================
// // Error Class
// // ============================================================================

// export class JournalServiceError extends Error {
//   public readonly status: number;
  
//   constructor(message: string, status: number = 400) {
//     super(message);
//     this.name = 'JournalServiceError';
//     this.status = status;
//   }
// }

// // ============================================================================
// // Constants
// // ============================================================================

// const EPSILON = 0.005; // half a paisa/cent tolerance for float rounding

// // ============================================================================
// // Service Functions
// // ============================================================================

// /**
//  * The single entry point every accounting event in the LMS goes through.
//  * Mirrors the PDF's `createJournal("narration", [[accountKeyOrId, debit, credit], ...])`
//  * trigger, but resolves accounts, generates the voucher number, posts the
//  * entry and updates account balances atomically in one DB transaction.
//  */
// export async function createJournal({
//   narration,
//   referenceType,
//   referenceId,
//   lines,
//   transactionDate = new Date(),
//   createdById,
//   status = 'POSTED',
//   loanDisbursementId,
// }: JournalCreateInput): Promise<JournalEntryWithLines> {
//   if (!Array.isArray(lines) || lines.length < 2) {
//     throw new JournalServiceError(
//       'A journal entry needs at least two lines (one debit, one credit)'
//     );
//   }

//   let totalDebit = 0;
//   let totalCredit = 0;
  
//   for (const line of lines) {
//     if (!line.accountId) {
//       throw new JournalServiceError('Every journal line needs an accountId');
//     }
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

//   return prisma.$transaction(async (tx) => {
//     const voucherNo = await nextVoucherNumber(tx, transactionDate);

//     const entry = await tx.journalEntry.create({
//       data: {
//         voucherNo,
//         voucherType: 'JOURNAL',
//         transactionDate: new Date(transactionDate),
//         referenceType: referenceType ?? null,
//         referenceId: referenceId ?? null,
//         narration: narration ?? null,
//         totalDebit,
//         totalCredit,
//         status: status as any,
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

//     // Only posted entries move account balances; a DRAFT sits inert until posted.
//     if (status === 'POSTED') {
//       for (const line of lines) {
//         await applyMovement(
//           tx,
//           line.accountId,
//           Number(line.debit ?? 0),
//           Number(line.credit ?? 0)
//         );
//       }
//     }

//     return entry as JournalEntryWithLines;
//   });
// }

// export async function postDraft(id: string): Promise<JournalEntryWithLines> {
//   const entry = await prisma.journalEntry.findUnique({
//     where: { id },
//     include: { lines: true },
//   });
  
//   if (!entry) {
//     throw new JournalServiceError('Journal entry not found', 404);
//   }
  
//   if (entry.status !== 'DRAFT') {
//     throw new JournalServiceError(
//       `Only DRAFT entries can be posted (this is ${entry.status})`
//     );
//   }

//   return prisma.$transaction(async (tx) => {
//     for (const line of entry.lines) {
//       await applyMovement(tx, line.accountId, line.debit, line.credit);
//     }
    
//     return tx.journalEntry.update({
//       where: { id },
//       data: { status: 'POSTED', postedAt: new Date() },
//       include: { lines: { include: { account: true } } },
//     }) as Promise<JournalEntryWithLines>;
//   });
// }

// export async function cancelJournal(id: string): Promise<JournalEntryWithLines> {
//   const entry = await prisma.journalEntry.findUnique({
//     where: { id },
//     include: { lines: true },
//   });
  
//   if (!entry) {
//     throw new JournalServiceError('Journal entry not found', 404);
//   }
  
//   if (entry.status === 'CANCELLED') {
//     throw new JournalServiceError('Journal entry is already cancelled');
//   }

//   return prisma.$transaction(async (tx) => {
//     // Reverse the balance impact only if it had been posted.
//     if (entry.status === 'POSTED') {
//       for (const line of entry.lines) {
//         // Swap debit/credit to reverse the effect on currentBalance.
//         await applyMovement(tx, line.accountId, line.credit, line.debit);
//       }
//     }
    
//     return tx.journalEntry.update({
//       where: { id },
//       data: { status: 'CANCELLED', cancelledAt: new Date() },
//       include: { lines: { include: { account: true } } },
//     }) as Promise<JournalEntryWithLines>;
//   });
// }

// export async function listJournalEntries(
//   options: JournalListOptions = {}
// ): Promise<{
//   total: number;
//   page: number;
//   pageSize: number;
//   data: JournalEntryWithLines[];
// }> {
//   const {
//     referenceType,
//     status,
//     from,
//     to,
//     accountSearch,
//     page = 1,
//     pageSize = 25,
//   } = options;

//   const where: Prisma.JournalEntryWhereInput = {
//     ...(referenceType && { referenceType }),
//     ...(status && { status: status as any }),
//     ...((from || to) && {
//       transactionDate: {
//         ...(from && { gte: new Date(from) }),
//         ...(to && { lte: new Date(to) }),
//       },
//     }),
//     ...(accountSearch && {
//       lines: { some: { account: { name: { contains: accountSearch, mode: 'insensitive' } } } },
//     }),
//   };

//   const [total, data] = await Promise.all([
//     prisma.journalEntry.count({ where }),
//     prisma.journalEntry.findMany({
//       where,
//       include: { lines: { include: { account: true } } },
//       orderBy: { transactionDate: 'desc' },
//       skip: (page - 1) * pageSize,
//       take: pageSize,
//     }),
//   ]);

//   return {
//     total,
//     page,
//     pageSize,
//     data: data as JournalEntryWithLines[],
//   };
// }

// export async function getJournalEntry(id: string): Promise<JournalEntryWithLines> {
//   const entry = await prisma.journalEntry.findUnique({
//     where: { id },
//     include: { lines: { include: { account: true } } },
//   });
  
//   if (!entry) {
//     throw new JournalServiceError('Journal entry not found', 404);
//   }
  
//   return entry as JournalEntryWithLines;
// }

// // ============================================================================
// // Additional Utility Functions
// // ============================================================================

// export async function getJournalEntryByVoucherNo(
//   voucherNo: string
// ): Promise<JournalEntryWithLines | null> {
//   const entry = await prisma.journalEntry.findUnique({
//     where: { voucherNo },
//     include: { lines: { include: { account: true } } },
//   });
  
//   return entry as JournalEntryWithLines | null;
// }

// export async function getJournalEntriesByReference(
//   referenceType: string,
//   referenceId: string
// ): Promise<JournalEntryWithLines[]> {
//   const entries = await prisma.journalEntry.findMany({
//     where: {
//       referenceType,
//       referenceId,
//     },
//     include: { lines: { include: { account: true } } },
//     orderBy: { transactionDate: 'desc' },
//   });
  
//   return entries as JournalEntryWithLines[];
// }

// export async function getJournalEntriesByDateRange(
//   from: Date,
//   to: Date
// ): Promise<JournalEntryWithLines[]> {
//   const entries = await prisma.journalEntry.findMany({
//     where: {
//       transactionDate: {
//         gte: from,
//         lte: to,
//       },
//       status: 'POSTED',
//     },
//     include: { lines: { include: { account: true } } },
//     orderBy: { transactionDate: 'asc' },
//   });
  
//   return entries as JournalEntryWithLines[];
// }

// export async function getJournalEntriesByAccount(
//   accountId: string,
//   options: { from?: Date; to?: Date; page?: number; pageSize?: number } = {}
// ): Promise<{
//   total: number;
//   page: number;
//   pageSize: number;
//   data: JournalEntryWithLines[];
// }> {
//   const { from, to, page = 1, pageSize = 25 } = options;

//   const where: Prisma.JournalEntryWhereInput = {
//     lines: { some: { accountId } },
//     status: 'POSTED',
//     ...((from || to) && {
//       transactionDate: {
//         ...(from && { gte: from }),
//         ...(to && { lte: to }),
//       },
//     }),
//   };

//   const [total, data] = await Promise.all([
//     prisma.journalEntry.count({ where }),
//     prisma.journalEntry.findMany({
//       where,
//       include: { lines: { include: { account: true } } },
//       orderBy: { transactionDate: 'desc' },
//       skip: (page - 1) * pageSize,
//       take: pageSize,
//     }),
//   ]);

//   return {
//     total,
//     page,
//     pageSize,
//     data: data as JournalEntryWithLines[],
//   };
// }

// // ============================================================================
// // Validation Functions
// // ============================================================================

// export function validateJournalLines(lines: JournalLineInput[]): void {
//   if (!lines || lines.length < 2) {
//     throw new JournalServiceError('A journal entry needs at least two lines');
//   }

//   let hasDebit = false;
//   let hasCredit = false;

//   for (const line of lines) {
//     if (!line.accountId) {
//       throw new JournalServiceError('Each line must have an accountId');
//     }

//     const debit = Number(line.debit ?? 0);
//     const credit = Number(line.credit ?? 0);

//     if (debit > 0 && credit > 0) {
//       throw new JournalServiceError('A journal line cannot have both debit and credit');
//     }

//     if (debit > 0) hasDebit = true;
//     if (credit > 0) hasCredit = true;

//     if (debit < 0 || credit < 0) {
//       throw new JournalServiceError('Debit and credit amounts must be positive');
//     }
//   }

//   if (!hasDebit || !hasCredit) {
//     throw new JournalServiceError('Journal entry must have at least one debit and one credit line');
//   }
// }

// export function validateJournalStatus(
//   currentStatus: string,
//   newStatus: string
// ): void {
//   const allowedTransitions: Record<string, string[]> = {
//     'DRAFT': ['POSTED', 'CANCELLED'],
//     'POSTED': ['CANCELLED'],
//     'CANCELLED': [],
//   };

//   const allowed = allowedTransitions[currentStatus] || [];
//   if (!allowed.includes(newStatus)) {
//     throw new JournalServiceError(
//       `Cannot transition journal from ${currentStatus} to ${newStatus}`,
//       400
//     );
//   }
// }

// // ============================================================================
// // Bulk Operations
// // ============================================================================

// export async function createMultipleJournals(
//   journals: JournalCreateInput[]
// ): Promise<JournalEntryWithLines[]> {
//   if (!journals || journals.length === 0) {
//     throw new JournalServiceError('No journals provided for bulk creation');
//   }

//   const results: JournalEntryWithLines[] = [];

//   for (const journal of journals) {
//     const entry = await createJournal(journal);
//     results.push(entry);
//   }

//   return results;
// }

// export async function deleteJournalEntry(id: string): Promise<JournalEntry> {
//   const entry = await prisma.journalEntry.findUnique({
//     where: { id },
//     include: { lines: true },
//   });

//   if (!entry) {
//     throw new JournalServiceError('Journal entry not found', 404);
//   }

//   if (entry.status === 'POSTED') {
//     throw new JournalServiceError(
//       'Cannot delete a posted journal entry. Cancel it first.',
//       400
//     );
//   }

//   return prisma.journalEntry.delete({
//     where: { id },
//   });
// }