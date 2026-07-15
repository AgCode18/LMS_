import prisma from '../lib/prisma.js';
import { isDebitNormal } from './accountService.js';

class ReportServiceError extends Error {
  constructor(message, status = 404) {
    super(message);
    this.name = 'ReportServiceError';
    this.status = status;
  }
}

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const dateRangeWhere = (from, to) => {
  if (!from && !to) return {};
  return {
    transactionDate: {
      ...(from && { gte: startOfDay(from) }),
      ...(to && { lte: endOfDay(to) }),
    },
  };
};

/**
 * Trial Balance: every account with its total debits/credits posted up to
 * `asOf`, and the resulting closing balance. Total Debit must equal Total
 * Credit across the whole book — that equality IS the trial balance check.
 */
export async function trialBalance({ asOf } = {}) {
  const accounts = await prisma.account.findMany({ orderBy: { code: 'asc' } });

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        status: 'POSTED',
        ...(asOf && { transactionDate: { lte: new Date(asOf) } }),
      },
    },
    select: { accountId: true, debit: true, credit: true },
  });

  const totals = new Map();
  for (const line of lines) {
    const t = totals.get(line.accountId) ?? { debit: 0, credit: 0 };
    t.debit += line.debit;
    t.credit += line.credit;
    totals.set(line.accountId, t);
  }

  const rows = accounts.map((acc) => {
    const t = totals.get(acc.id) ?? { debit: 0, credit: 0 };
    const closingBalance = isDebitNormal(acc.type)
      ? acc.openingBalance + t.debit - t.credit
      : acc.openingBalance + t.credit - t.debit;
    return {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      totalDebit: t.debit,
      totalCredit: t.credit,
      closingBalance,
    };
  });

  const totalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);

  return {
    asOf: asOf ?? new Date().toISOString(),
    rows,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

/** General/account-specific ledger with a running balance, newest last. */
export async function accountLedger(accountId, { from, to } = {}) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new ReportServiceError('Account not found', 404);

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId,
      journalEntry: { status: 'POSTED', ...dateRangeWhere(from, to) },
    },
    include: { journalEntry: true },
    orderBy: { journalEntry: { transactionDate: 'asc' } },
  });

  let running = account.openingBalance;
  const debitNormal = isDebitNormal(account.type);

  const rows = lines.map((l) => {
    running += debitNormal ? l.debit - l.credit : l.credit - l.debit;
    return {
      date: l.journalEntry.transactionDate,
      voucherNo: l.journalEntry.voucherNo,
      narration: l.description ?? l.journalEntry.narration,
      referenceType: l.journalEntry.referenceType,
      referenceId: l.journalEntry.referenceId,
      debit: l.debit,
      credit: l.credit,
      runningBalance: running,
    };
  });

  return {
    account: { id: account.id, code: account.code, name: account.name, type: account.type },
    openingBalance: account.openingBalance,
    closingBalance: running,
    rows,
  };
}
export async function bankReconciliation(accountId, { statementDate } = {}) {
  if (!statementDate) {
    throw new ReportServiceError('statementDate is required', 400);
  }

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new ReportServiceError('Account not found', 404);

  const allLines = await prisma.journalEntryLine.findMany({
    where: {
      accountId,
      journalEntry: {
        status: 'POSTED',
        transactionDate: { lte: endOfDay(statementDate) },
      },
    },
    include: { journalEntry: true },
    orderBy: [
      { journalEntry: { transactionDate: 'asc' } },
      { journalEntry: { voucherNo: 'asc' } },
    ],
  });

  let running = account.openingBalance;
  const debitNormal = isDebitNormal(account.type);

  const rows = allLines.map((l) => {
    running += debitNormal ? l.debit - l.credit : l.credit - l.debit;
    return {
      id: l.id,
      date: l.journalEntry.transactionDate,
      voucherNo: l.journalEntry.voucherNo,
      narration: l.description ?? l.journalEntry.narration,
      debit: l.debit,
      credit: l.credit,
      runningBalance: running,
      isCleared: l.isCleared,
      clearedDate: l.clearedDate,
      isDepositInTransit: l.debit > 0 && !l.isCleared,
      isOutstandingCheck: l.credit > 0 && !l.isCleared,
    };
  });

  const depositsInTransit = rows
    .filter((row) => row.isDepositInTransit)
    .reduce((sum, row) => sum + row.debit, 0);

  const outstandingChecks = rows
    .filter((row) => row.isOutstandingCheck)
    .reduce((sum, row) => sum + row.credit, 0);

  return {
    account: { id: account.id, code: account.code, name: account.name, type: account.type },
    openingBalance: account.openingBalance,
    bookBalance: running,
    statementDate: new Date(statementDate),
    rows, // full history — from/to filtering now happens client-side, display-only
    depositsInTransit,
    outstandingChecks,
    netAdjustment: depositsInTransit - outstandingChecks,
  };
}

/** Marks a single journal entry line as cleared/uncleared by the bank. */
export async function setLineClearedStatus(lineId, { isCleared, clearedDate }) {
  const line = await prisma.journalEntryLine.findUnique({ where: { id: lineId } });
  if (!line) throw new ReportServiceError('Journal entry line not found', 404);

  return prisma.journalEntryLine.update({
    where: { id: lineId },
    data: {
      isCleared: !!isCleared,
      clearedDate: isCleared ? new Date(clearedDate || Date.now()) : null,
    },
  });
}



/** Profit & Loss for a period: Income accounts minus Expense accounts. */
export async function profitAndLoss({ from, to } = {}) {
  const lines = await prisma.journalEntryLine.findMany({
    where: { journalEntry: { status: 'POSTED', ...dateRangeWhere(from, to) } },
    include: { account: true },
  });

  const byAccount = new Map();
  for (const l of lines) {
    if (l.account.type !== 'INCOME' && l.account.type !== 'EXPENSE') continue;
    const key = l.account.id;
    const cur = byAccount.get(key) ?? {
      code: l.account.code,
      name: l.account.name,
      type: l.account.type,
      amount: 0,
    };
    cur.amount += l.account.type === 'INCOME' ? l.credit - l.debit : l.debit - l.credit;
    byAccount.set(key, cur);
  }

  const rows = [...byAccount.values()];
  const income = rows.filter((r) => r.type === 'INCOME');
  const expense = rows.filter((r) => r.type === 'EXPENSE');
  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expense.reduce((s, r) => s + r.amount, 0);

  return {
    from: from ?? null,
    to: to ?? null,
    income,
    expense,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
  };
}

/** Balance Sheet as of a date: Assets vs Liabilities + Equity (+ retained P&L). */
export async function balanceSheet({ asOf } = {}) {
  const tb = await trialBalance({ asOf });
  const assets = tb.rows.filter((r) => r.type === 'ASSET');
  const liabilities = tb.rows.filter((r) => r.type === 'LIABILITY');
  const equity = tb.rows.filter((r) => r.type === 'EQUITY');

  const pnl = await profitAndLoss({ to: asOf });

  const totalAssets = assets.reduce((s, r) => s + r.closingBalance, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.closingBalance, 0);
  const totalEquity = equity.reduce((s, r) => s + r.closingBalance, 0) + pnl.netProfit;

  return {
    asOf: asOf ?? new Date().toISOString(),
    assets,
    liabilities,
    equity,
    retainedEarnings: pnl.netProfit,
    totalAssets,
    totalLiabilities,
    totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
}

/**
 * Customer Ledger: every posted journal line whose journal entry traces
 * back (via referenceId) to one of this customer's loan applications.
 * This works without a customer-specific sub-ledger account by resolving
 * the customer's loanApplicationIds first.
 */
export async function customerLedger(customerId) {
  const loans = await prisma.loanApplication.findMany({
    where: { customerId },
    select: { id: true, loanNumber: true },
  });
  const loanIds = loans.map(({ id }) => id);
  if (loanIds.length === 0) return { customerId, loans: [], entries: [] };

  const entries = await prisma.journalEntry.findMany({
    where: { status: 'POSTED', referenceId: { in: loanIds } },
    include: { lines: { include: { account: true } } },
    orderBy: { transactionDate: 'asc' },
  });

  return { customerId, loans, entries };
}

/** Branch-wise summary — sums posted disbursement/EMI/recovery amounts per branch. */
export async function branchWiseSummary({ from, to, branchId, branchSearch } = {}) {
  const searchCondition = branchSearch
    ? {
        branch: {
          OR: [
            // Some Prisma clients/environments may not support the `mode` option
            // on string filters. Use a plain `contains` filter which is widely
            // supported; keep searches simple and explicit.
            { name: { contains: branchSearch } },
            { code: { contains: branchSearch } },
          ],
        },
      }
    : {};
  const branchWhere = {
    ...(branchId ? { branchId } : {}),
    ...searchCondition,
  };

  let disbursements;
  let recoveries;
  try {
    [disbursements, recoveries] = await Promise.all([
      prisma.loanDisbursement.groupBy({
        by: ['branchId'],
        where: {
          accountingStatus: 'POSTED',
          ...branchWhere,
          ...((from || to) && {
            disbursementDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }),
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.loanApplication.groupBy({
        by: ['branchId'],
        where: branchWhere,
        _count: { _all: true },
      }),
    ]);
  } catch (err) {
    // Provide a clearer, actionable error to the API consumer instead of
    // forwarding the raw Prisma error which can be confusing or leak
    // implementation details.
    throw new ReportServiceError(
      'Branch search failed: invalid search parameter or unsupported database feature. Try a simpler search term.',
      400,
    );
  }

  const branchIds = Array.from(
    new Set([
      ...disbursements.map((d) => d.branchId),
      ...recoveries.map((r) => r.branchId),
    ].filter(Boolean)),
  );
  const branches = branchIds.length
    ? await prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, code: true, name: true },
      })
    : [];
  const branchMap = new Map(branches.map((b) => [b.id, b]));

  const attachBranch = (row) => ({
    ...row,
    branchCode: branchMap.get(row.branchId)?.code ?? null,
    branchName: branchMap.get(row.branchId)?.name ?? null,
  });

  return {
    disbursementsByBranch: disbursements.map(attachBranch),
    applicationsByBranch: recoveries.map(attachBranch),
  };
}




// typescript code  👇👇


// import { Prisma, Account, JournalEntryLine, JournalEntry, Branch } from "@prisma/client";
// import prisma from '../lib/prisma.js';
// import { isDebitNormal } from './accountService.js';

// // ============================================================================
// // Error Class
// // ============================================================================

// export class ReportServiceError extends Error {
//   public status: number;
  
//   constructor(message: string, status: number = 404) {
//     super(message);
//     this.name = 'ReportServiceError';
//     this.status = status;
//     Object.setPrototypeOf(this, ReportServiceError.prototype);
//   }
// }

// // ============================================================================
// // Type Definitions
// // ============================================================================

// export interface DateRange {
//   from?: Date | string;
//   to?: Date | string;
// }

// export interface TrialBalanceParams {
//   asOf?: Date | string;
// }

// export interface AccountLedgerParams {
//   from?: Date | string;
//   to?: Date | string;
// }

// export interface BankReconciliationParams {
//   statementDate: Date | string;
// }

// export interface ClearLineParams {
//   isCleared: boolean;
//   clearedDate?: Date | string;
// }

// export interface ProfitAndLossParams {
//   from?: Date | string;
//   to?: Date | string;
// }

// export interface BalanceSheetParams {
//   asOf?: Date | string;
// }

// export interface BranchWiseSummaryParams {
//   from?: Date | string;
//   to?: Date | string;
//   branchId?: string;
//   branchSearch?: string;
// }

// // Report Row Types
// export interface TrialBalanceRow {
//   accountId: string;
//   code: string;
//   name: string;
//   type: string;
//   totalDebit: number;
//   totalCredit: number;
//   closingBalance: number;
// }

// export interface TrialBalanceResult {
//   asOf: string;
//   rows: TrialBalanceRow[];
//   totalDebit: number;
//   totalCredit: number;
//   balanced: boolean;
// }

// export interface AccountLedgerRow {
//   date: Date;
//   voucherNo: string;
//   narration: string | null;
//   referenceType: string | null;
//   referenceId: string | null;
//   debit: number;
//   credit: number;
//   runningBalance: number;
// }

// export interface AccountLedgerResult {
//   account: {
//     id: string;
//     code: string;
//     name: string;
//     type: string;
//   };
//   openingBalance: number;
//   closingBalance: number;
//   rows: AccountLedgerRow[];
// }

// export interface BankReconciliationRow {
//   id: string;
//   date: Date;
//   voucherNo: string;
//   narration: string | null;
//   debit: number;
//   credit: number;
//   runningBalance: number;
//   isCleared: boolean;
//   clearedDate: Date | null;
//   isDepositInTransit: boolean;
//   isOutstandingCheck: boolean;
// }

// export interface BankReconciliationResult {
//   account: {
//     id: string;
//     code: string;
//     name: string;
//     type: string;
//   };
//   openingBalance: number;
//   bookBalance: number;
//   statementDate: Date;
//   rows: BankReconciliationRow[];
//   depositsInTransit: number;
//   outstandingChecks: number;
//   netAdjustment: number;
// }

// export interface ProfitAndLossRow {
//   code: string;
//   name: string;
//   type: string;
//   amount: number;
// }

// export interface ProfitAndLossResult {
//   from: Date | string | null;
//   to: Date | string | null;
//   income: ProfitAndLossRow[];
//   expense: ProfitAndLossRow[];
//   totalIncome: number;
//   totalExpense: number;
//   netProfit: number;
// }

// export interface BalanceSheetRow {
//   accountId: string;
//   code: string;
//   name: string;
//   type: string;
//   totalDebit: number;
//   totalCredit: number;
//   closingBalance: number;
// }

// export interface BalanceSheetResult {
//   asOf: string;
//   assets: BalanceSheetRow[];
//   liabilities: BalanceSheetRow[];
//   equity: BalanceSheetRow[];
//   retainedEarnings: number;
//   totalAssets: number;
//   totalLiabilities: number;
//   totalEquity: number;
//   balanced: boolean;
// }

// export interface CustomerLedgerResult {
//   customerId: string;
//   loans: any[];
//   entries: any[];
// }

// export interface BranchWiseSummaryRow {
//   branchId: string;
//   branchCode: string | null;
//   branchName: string | null;
//   _sum?: { amount: number | null };
//   _count?: { _all: number };
//   amount?: number;
//   count?: number;
// }

// export interface BranchWiseSummaryResult {
//   disbursementsByBranch: BranchWiseSummaryRow[];
//   applicationsByBranch: BranchWiseSummaryRow[];
// }

// // ============================================================================
// // Helper Functions
// // ============================================================================

// const startOfDay = (date: Date | string): Date => {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const endOfDay = (date: Date | string): Date => {
//   const d = new Date(date);
//   d.setHours(23, 59, 59, 999);
//   return d;
// };

// const dateRangeWhere = (from?: Date | string, to?: Date | string): any => {
//   if (!from && !to) return {};
//   return {
//     transactionDate: {
//       ...(from && { gte: startOfDay(from) }),
//       ...(to && { lte: endOfDay(to) }),
//     },
//   };
// };

// // ============================================================================
// // 1. Trial Balance
// // ============================================================================

// /**
//  * Trial Balance: every account with its total debits/credits posted up to
//  * `asOf`, and the resulting closing balance. Total Debit must equal Total
//  * Credit across the whole book — that equality IS the trial balance check.
//  */
// export async function trialBalance(
//   { asOf }: TrialBalanceParams = {}
// ): Promise<TrialBalanceResult> {
//   const accounts = await prisma.account.findMany({
//     orderBy: { code: 'asc' },
//   });

//   const lines = await prisma.journalEntryLine.findMany({
//     where: {
//       journalEntry: {
//         status: 'POSTED',
//         ...(asOf && { transactionDate: { lte: new Date(asOf) } }),
//       },
//     },
//     select: { accountId: true, debit: true, credit: true },
//   });

//   const totals = new Map<string, { debit: number; credit: number }>();
//   for (const line of lines) {
//     const t = totals.get(line.accountId) ?? { debit: 0, credit: 0 };
//     t.debit += Number(line.debit);
//     t.credit += Number(line.credit);
//     totals.set(line.accountId, t);
//   }

//   const rows: TrialBalanceRow[] = accounts.map((acc) => {
//     const t = totals.get(acc.id) ?? { debit: 0, credit: 0 };
//     const closingBalance = isDebitNormal(acc.type)
//       ? Number(acc.openingBalance) + t.debit - t.credit
//       : Number(acc.openingBalance) + t.credit - t.debit;
//     return {
//       accountId: acc.id,
//       code: acc.code,
//       name: acc.name,
//       type: acc.type,
//       totalDebit: t.debit,
//       totalCredit: t.credit,
//       closingBalance,
//     };
//   });

//   const totalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
//   const totalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);

//   return {
//     asOf: asOf ? new Date(asOf).toISOString() : new Date().toISOString(),
//     rows,
//     totalDebit,
//     totalCredit,
//     balanced: Math.abs(totalDebit - totalCredit) < 0.01,
//   };
// }

// // ============================================================================
// // 2. Account Ledger
// // ============================================================================

// /** General/account-specific ledger with a running balance, newest last. */
// export async function accountLedger(
//   accountId: string,
//   { from, to }: AccountLedgerParams = {}
// ): Promise<AccountLedgerResult> {
//   const account = await prisma.account.findUnique({
//     where: { id: accountId },
//   });
  
//   if (!account) {
//     throw new ReportServiceError('Account not found', 404);
//   }

//   const lines = await prisma.journalEntryLine.findMany({
//     where: {
//       accountId,
//       journalEntry: { 
//         status: 'POSTED', 
//         ...dateRangeWhere(from, to) 
//       },
//     },
//     include: { journalEntry: true },
//     orderBy: { journalEntry: { transactionDate: 'asc' } },
//   });

//   let running = Number(account.openingBalance);
//   const debitNormal = isDebitNormal(account.type);

//   const rows: AccountLedgerRow[] = lines.map((l) => {
//     running += debitNormal 
//       ? Number(l.debit) - Number(l.credit) 
//       : Number(l.credit) - Number(l.debit);
//     return {
//       date: l.journalEntry.transactionDate,
//       voucherNo: l.journalEntry.voucherNo,
//       narration: l.description ?? l.journalEntry.narration,
//       referenceType: l.journalEntry.referenceType,
//       referenceId: l.journalEntry.referenceId,
//       debit: Number(l.debit),
//       credit: Number(l.credit),
//       runningBalance: running,
//     };
//   });

//   return {
//     account: {
//       id: account.id,
//       code: account.code,
//       name: account.name,
//       type: account.type,
//     },
//     openingBalance: Number(account.openingBalance),
//     closingBalance: running,
//     rows,
//   };
// }

// // ============================================================================
// // 3. Bank Reconciliation
// // ============================================================================

// export async function bankReconciliation(
//   accountId: string,
//   { statementDate }: BankReconciliationParams
// ): Promise<BankReconciliationResult> {
//   if (!statementDate) {
//     throw new ReportServiceError('statementDate is required', 400);
//   }

//   const account = await prisma.account.findUnique({
//     where: { id: accountId },
//   });
  
//   if (!account) {
//     throw new ReportServiceError('Account not found', 404);
//   }

//   const allLines = await prisma.journalEntryLine.findMany({
//     where: {
//       accountId,
//       journalEntry: {
//         status: 'POSTED',
//         transactionDate: { lte: endOfDay(statementDate) },
//       },
//     },
//     include: { journalEntry: true },
//     orderBy: [
//       { journalEntry: { transactionDate: 'asc' } },
//       { journalEntry: { voucherNo: 'asc' } },
//     ],
//   });

//   let running = Number(account.openingBalance);
//   const debitNormal = isDebitNormal(account.type);

//   const rows: BankReconciliationRow[] = allLines.map((l) => {
//     running += debitNormal 
//       ? Number(l.debit) - Number(l.credit) 
//       : Number(l.credit) - Number(l.debit);
//     return {
//       id: l.id,
//       date: l.journalEntry.transactionDate,
//       voucherNo: l.journalEntry.voucherNo,
//       narration: l.description ?? l.journalEntry.narration,
//       debit: Number(l.debit),
//       credit: Number(l.credit),
//       runningBalance: running,
//       isCleared: l.isCleared ?? false,
//       clearedDate: l.clearedDate ?? null,
//       isDepositInTransit: Number(l.debit) > 0 && !l.isCleared,
//       isOutstandingCheck: Number(l.credit) > 0 && !l.isCleared,
//     };
//   });

//   const depositsInTransit = rows
//     .filter((row) => row.isDepositInTransit)
//     .reduce((sum, row) => sum + row.debit, 0);

//   const outstandingChecks = rows
//     .filter((row) => row.isOutstandingCheck)
//     .reduce((sum, row) => sum + row.credit, 0);

//   return {
//     account: {
//       id: account.id,
//       code: account.code,
//       name: account.name,
//       type: account.type,
//     },
//     openingBalance: Number(account.openingBalance),
//     bookBalance: running,
//     statementDate: new Date(statementDate),
//     rows,
//     depositsInTransit,
//     outstandingChecks,
//     netAdjustment: depositsInTransit - outstandingChecks,
//   };
// }

// // ============================================================================
// // 4. Set Line Cleared Status
// // ============================================================================

// /** Marks a single journal entry line as cleared/uncleared by the bank. */
// export async function setLineClearedStatus(
//   lineId: string,
//   { isCleared, clearedDate }: ClearLineParams
// ): Promise<JournalEntryLine> {
//   const line = await prisma.journalEntryLine.findUnique({
//     where: { id: lineId },
//   });
  
//   if (!line) {
//     throw new ReportServiceError('Journal entry line not found', 404);
//   }

//   return prisma.journalEntryLine.update({
//     where: { id: lineId },
//     data: {
//       isCleared: !!isCleared,
//       clearedDate: isCleared ? new Date(clearedDate || Date.now()) : null,
//     },
//   });
// }

// // ============================================================================
// // 5. Profit & Loss
// // ============================================================================

// /** Profit & Loss for a period: Income accounts minus Expense accounts. */
// export async function profitAndLoss(
//   { from, to }: ProfitAndLossParams = {}
// ): Promise<ProfitAndLossResult> {
//   const lines = await prisma.journalEntryLine.findMany({
//     where: {
//       journalEntry: { 
//         status: 'POSTED', 
//         ...dateRangeWhere(from, to) 
//       },
//     },
//     include: { account: true },
//   });

//   const byAccount = new Map<string, {
//     code: string;
//     name: string;
//     type: string;
//     amount: number;
//   }>();

//   for (const l of lines) {
//     if (l.account.type !== 'INCOME' && l.account.type !== 'EXPENSE') continue;
    
//     const key = l.account.id;
//     const cur = byAccount.get(key) ?? {
//       code: l.account.code,
//       name: l.account.name,
//       type: l.account.type,
//       amount: 0,
//     };
    
//     cur.amount += l.account.type === 'INCOME' 
//       ? Number(l.credit) - Number(l.debit) 
//       : Number(l.debit) - Number(l.credit);
    
//     byAccount.set(key, cur);
//   }

//   const rows = [...byAccount.values()];
//   const income = rows.filter((r) => r.type === 'INCOME');
//   const expense = rows.filter((r) => r.type === 'EXPENSE');
//   const totalIncome = income.reduce((s, r) => s + r.amount, 0);
//   const totalExpense = expense.reduce((s, r) => s + r.amount, 0);

//   return {
//     from: from ?? null,
//     to: to ?? null,
//     income,
//     expense,
//     totalIncome,
//     totalExpense,
//     netProfit: totalIncome - totalExpense,
//   };
// }

// // ============================================================================
// // 6. Balance Sheet
// // ============================================================================

// /** Balance Sheet as of a date: Assets vs Liabilities + Equity (+ retained P&L). */
// export async function balanceSheet(
//   { asOf }: BalanceSheetParams = {}
// ): Promise<BalanceSheetResult> {
//   const tb = await trialBalance({ asOf });
//   const assets = tb.rows.filter((r) => r.type === 'ASSET');
//   const liabilities = tb.rows.filter((r) => r.type === 'LIABILITY');
//   const equity = tb.rows.filter((r) => r.type === 'EQUITY');

//   const pnl = await profitAndLoss({ to: asOf });

//   const totalAssets = assets.reduce((s, r) => s + r.closingBalance, 0);
//   const totalLiabilities = liabilities.reduce((s, r) => s + r.closingBalance, 0);
//   const totalEquity = equity.reduce((s, r) => s + r.closingBalance, 0) + pnl.netProfit;

//   return {
//     asOf: asOf ? new Date(asOf).toISOString() : new Date().toISOString(),
//     assets,
//     liabilities,
//     equity,
//     retainedEarnings: pnl.netProfit,
//     totalAssets,
//     totalLiabilities,
//     totalEquity,
//     balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
//   };
// }

// // ============================================================================
// // 7. Customer Ledger
// // ============================================================================

// /**
//  * Customer Ledger: every posted journal line whose journal entry traces
//  * back (via referenceId) to one of this customer's loan applications.
//  * This works without a customer-specific sub-ledger account by resolving
//  * the customer's loanApplicationIds first.
//  */
// export async function customerLedger(
//   customerId: string
// ): Promise<CustomerLedgerResult> {
//   const loans = await prisma.loanApplication.findMany({
//     where: { customerId },
//     select: { id: true, loanNumber: true },
//   });
  
//   const loanIds = loans.map(({ id }) => id);
//   if (loanIds.length === 0) {
//     return { customerId, loans: [], entries: [] };
//   }

//   const entries = await prisma.journalEntry.findMany({
//     where: {
//       status: 'POSTED',
//       referenceId: { in: loanIds },
//     },
//     include: { lines: { include: { account: true } } },
//     orderBy: { transactionDate: 'asc' },
//   });

//   return { customerId, loans, entries };
// }

// // ============================================================================
// // 8. Branch Wise Summary
// // ============================================================================

// /** Branch-wise summary — sums posted disbursement/EMI/recovery amounts per branch. */
// export async function branchWiseSummary({
//   from,
//   to,
//   branchId,
//   branchSearch,
// }: BranchWiseSummaryParams = {}): Promise<BranchWiseSummaryResult> {
//   const searchCondition = branchSearch
//     ? {
//         branch: {
//           OR: [
//             { name: { contains: branchSearch, mode: 'insensitive' as any } },
//             { code: { contains: branchSearch, mode: 'insensitive' as any } },
//           ],
//         },
//       }
//     : {};
  
//   const branchWhere: any = {
//     ...(branchId ? { branchId } : {}),
//     ...searchCondition,
//   };

//   let disbursements: any[];
//   let recoveries: any[];
  
//   try {
//     [disbursements, recoveries] = await Promise.all([
//       prisma.loanDisbursement.groupBy({
//         by: ['branchId'],
//         where: {
//           accountingStatus: 'POSTED',
//           ...branchWhere,
//           ...((from || to) && {
//             disbursementDate: {
//               ...(from && { gte: new Date(from) }),
//               ...(to && { lte: new Date(to) }),
//             },
//           }),
//         },
//         _sum: { amount: true },
//         _count: { _all: true },
//       }),
//       prisma.loanApplication.groupBy({
//         by: ['branchId'],
//         where: branchWhere,
//         _count: { _all: true },
//       }),
//     ]);
//   } catch (err) {
//     // Provide a clearer, actionable error to the API consumer instead of
//     // forwarding the raw Prisma error which can be confusing or leak
//     // implementation details.
//     throw new ReportServiceError(
//       'Branch search failed: invalid search parameter or unsupported database feature. Try a simpler search term.',
//       400
//     );
//   }

//   const branchIds = Array.from(
//     new Set([
//       ...disbursements.map((d: any) => d.branchId),
//       ...recoveries.map((r: any) => r.branchId),
//     ].filter(Boolean))
//   );
  
//   const branches = branchIds.length
//     ? await prisma.branch.findMany({
//         where: { id: { in: branchIds } },
//         select: { id: true, code: true, name: true },
//       })
//     : [];
  
//   const branchMap = new Map(branches.map((b) => [b.id, b]));

//   const attachBranch = (row: any): BranchWiseSummaryRow => ({
//     ...row,
//     branchCode: branchMap.get(row.branchId)?.code ?? null,
//     branchName: branchMap.get(row.branchId)?.name ?? null,
//   });

//   return {
//     disbursementsByBranch: disbursements.map(attachBranch),
//     applicationsByBranch: recoveries.map(attachBranch),
//   };
// }

// // ============================================================================
// // Optional: Service Interface
// // ============================================================================

// export interface ReportService {
//   trialBalance: (params?: TrialBalanceParams) => Promise<TrialBalanceResult>;
//   accountLedger: (accountId: string, params?: AccountLedgerParams) => Promise<AccountLedgerResult>;
//   bankReconciliation: (accountId: string, params: BankReconciliationParams) => Promise<BankReconciliationResult>;
//   setLineClearedStatus: (lineId: string, params: ClearLineParams) => Promise<JournalEntryLine>;
//   profitAndLoss: (params?: ProfitAndLossParams) => Promise<ProfitAndLossResult>;
//   balanceSheet: (params?: BalanceSheetParams) => Promise<BalanceSheetResult>;
//   customerLedger: (customerId: string) => Promise<CustomerLedgerResult>;
//   branchWiseSummary: (params?: BranchWiseSummaryParams) => Promise<BranchWiseSummaryResult>;
// }