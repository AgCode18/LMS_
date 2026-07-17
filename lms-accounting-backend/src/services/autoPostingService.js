import prisma from "../lib/prisma.js";
import { createJournal } from "./journalService.js";
import { getBySystemKey } from "./accountService.js";
import KEYS from "../utils/systemAccounts.js";

/**
 * Implements the "Auto Posting Rules" table from the accounting spec:
 *   LMS Event                -> Accounting Entry
 *   Loan Disbursement        -> Dr Loan Receivable / Cr Bank
 *   EMI Collection           -> Dr Bank / Cr Loan Receivable, Interest Income, Penalty Income, Bounce Income
 *   Penalty Collection       -> Dr Bank / Cr Penalty Income
 *   Processing Fee           -> Dr Customer Receivable (or Bank) / Cr Processing Fee Income
 *   Refund                   -> reverse of the original receipt
 *   Write-Off                -> Dr Bad Debt Expense / Cr Loan Receivable
 *
 * Every function here is idempotent-safe to call once per business event;
 * wire these calls into your existing loan-application/EMI/recovery
 * controllers right after the underlying record is created.
 */

// ---------------------------------------------------------------------
// 1. Loan Disbursement
// ---------------------------------------------------------------------
export async function postLoanDisbursement({
  loanDisbursementId,
  loanApplicationId,
  amount,
  disbursementDate,
  narration,
  branchId,
  disbursementMode = "BANK_TRANSFER",
}) {
  const [loanReceivable, bank] = await Promise.all([
    getBySystemKey(KEYS.LOAN_RECEIVABLE),
    getBySystemKey(KEYS.BANK_ACCOUNT),
  ]);

  // If no LoanDisbursement row exists yet (e.g. a real caller creates it
  // first and only then triggers accounting), create a minimal one here —
  // convenient for demos/tests hitting this endpoint directly.
  let resolvedDisbursementId = loanDisbursementId;
  if (!resolvedDisbursementId) {
    const loanApp = await prisma.loanApplication.findUnique({
      where: { id: loanApplicationId },
    });
    if (!loanApp)
      throw new Error(`LoanApplication ${loanApplicationId} not found`);
    const disbursement = await prisma.loanDisbursement.create({
      data: {
        loanApplicationId,
        amount,
        principalAmount: amount,
        disbursementMode,
        transactionReference: `DISB-${Date.now()}`,
        branchId: branchId ?? loanApp.branchId,
      },
    });
    resolvedDisbursementId = disbursement.id;
  }

  const entry = await createJournal({
    narration:
      narration ?? `Loan disbursement for application ${loanApplicationId}`,
    referenceType: "LOAN_DISBURSEMENT",
    referenceId: loanApplicationId,
    transactionDate: disbursementDate ?? new Date(),
    loanDisbursementId: resolvedDisbursementId,
    lines: [
      {
        accountId: loanReceivable.id,
        debit: amount,
        description: "Loan principal receivable",
      },
      {
        accountId: bank.id,
        credit: amount,
        description: "Funds disbursed from bank",
      },
    ],
  });

  await prisma.loanDisbursement.update({
    where: { id: resolvedDisbursementId },
    data: { accountingStatus: "POSTED" },
  });

  return entry;
}

// ---------------------------------------------------------------------
// 2. EMI Collection (principal + interest + optional penalty/bounce)
// ---------------------------------------------------------------------
export async function postEmiCollection({
  emiPaymentId,
  emiScheduleId,
  loanApplicationId,
  principalAmount = 0,
  interestAmount = 0,
  penaltyAmount = 0,
  bounceAmount = 0,
  paymentDate,
  narration,
  paymentMode = "UPI",
}) {
  const total = principalAmount + interestAmount + penaltyAmount + bounceAmount;
  if (total <= 0)
    throw new Error("EMI collection amount must be greater than zero");

  let resolvedEmiPaymentId = emiPaymentId;
  if (!resolvedEmiPaymentId) {
    if (!emiScheduleId)
      throw new Error("Provide either emiPaymentId or emiScheduleId");
    const payment = await prisma.emiPayment.create({
      data: {
        emiScheduleId,
        amount: total,
        principalPaid: principalAmount,
        interestPaid: interestAmount,
        penaltyPaid: penaltyAmount,
        bouncePaid: bounceAmount,
        paymentDate: paymentDate ?? new Date(),
        paymentMode,
      },
    });
    resolvedEmiPaymentId = payment.id;
  }

  const needed = [
    KEYS.BANK_ACCOUNT,
    KEYS.LOAN_RECEIVABLE,
    KEYS.INTEREST_INCOME,
  ];
  if (penaltyAmount > 0) needed.push(KEYS.PENALTY_INCOME);
  if (bounceAmount > 0) needed.push(KEYS.BOUNCE_CHARGE_INCOME);

  const accounts = Object.fromEntries(
    await Promise.all(
      needed.map(async (key) => [key, await getBySystemKey(key)]),
    ),
  );

  const lines = [
    {
      accountId: accounts[KEYS.BANK_ACCOUNT].id,
      debit: total,
      description: "EMI received",
    },
  ];
  if (principalAmount > 0) {
    lines.push({
      accountId: accounts[KEYS.LOAN_RECEIVABLE].id,
      credit: principalAmount,
      description: "Principal component",
    });
  }
  if (interestAmount > 0) {
    lines.push({
      accountId: accounts[KEYS.INTEREST_INCOME].id,
      credit: interestAmount,
      description: "Interest component",
    });
  }
  if (penaltyAmount > 0) {
    lines.push({
      accountId: accounts[KEYS.PENALTY_INCOME].id,
      credit: penaltyAmount,
      description: "Late payment penalty",
    });
  }
  if (bounceAmount > 0) {
    lines.push({
      accountId: accounts[KEYS.BOUNCE_CHARGE_INCOME].id,
      credit: bounceAmount,
      description: "Bounce charges",
    });
  }

  const entry = await createJournal({
    narration: narration ?? `EMI collection for loan ${loanApplicationId}`,
    referenceType: "EMI_PAYMENT",
    referenceId: resolvedEmiPaymentId,
    transactionDate: paymentDate ?? new Date(),
    lines,
  });

  await prisma.emiPayment.update({
    where: { id: resolvedEmiPaymentId },
    data: { accountingStatus: "POSTED", journalEntryId: entry.id },
  });

  return entry;
}

// ---------------------------------------------------------------------
// 3. Standalone Penalty Collection (penalty collected outside an EMI, e.g. a delinquency fee)
// ---------------------------------------------------------------------

export async function postPenaltyCollection({
  referenceId,
  amount,
  collectionDate,
  narration,
}) {
  const [bank, penaltyIncome] = await Promise.all([
    getBySystemKey(KEYS.BANK_ACCOUNT),
    getBySystemKey(KEYS.PENALTY_INCOME),
  ]);

  return createJournal({
    narration: narration ?? `Penalty collected for ${referenceId}`,
    referenceType: "PENALTY",
    referenceId,
    transactionDate: collectionDate ?? new Date(),
    lines: [
      { accountId: bank.id, debit: amount, description: "Penalty received" },
      {
        accountId: penaltyIncome.id,
        credit: amount,
        description: "Penalty income",
      },
    ],
  });
}

// ---------------------------------------------------------------------
// 4. Processing Fee (charged at login/disbursement)
// ---------------------------------------------------------------------
export async function postProcessingFee({
  loanApplicationId,
  amount,
  collectedImmediately = true,
  feeDate,
  narration,
}) {
  const [debitAccount, feeIncome] = await Promise.all([
    getBySystemKey(
      collectedImmediately ? KEYS.BANK_ACCOUNT : KEYS.CUSTOMER_RECEIVABLE,
    ),
    getBySystemKey(KEYS.PROCESSING_FEE_INCOME),
  ]);

  return createJournal({
    narration: narration ?? `Processing fee for loan ${loanApplicationId}`,
    referenceType: "PROCESSING_FEE",
    referenceId: loanApplicationId,
    transactionDate: feeDate ?? new Date(),
    lines: [
      {
        accountId: debitAccount.id,
        debit: amount,
        description: collectedImmediately
          ? "Processing fee collected"
          : "Processing fee receivable",
      },
      {
        accountId: feeIncome.id,
        credit: amount,
        description: "Processing fee income",
      },
    ],
  });
}

// ---------------------------------------------------------------------
// 5. Refund (reverses a prior receipt, e.g. excess EMI payment or fee refund)
// ---------------------------------------------------------------------
export async function postRefund({
  referenceId,
  amount,
  refundDate,
  reason,
  narration,
}) {
  const [bank, feeIncome] = await Promise.all([
    getBySystemKey(KEYS.BANK_ACCOUNT),
    getBySystemKey(KEYS.PROCESSING_FEE_INCOME),
  ]);

  return createJournal({
    narration: narration ?? `Refund: ${reason ?? referenceId}`,
    referenceType: "REFUND",
    referenceId,
    transactionDate: refundDate ?? new Date(),
    lines: [
      {
        accountId: feeIncome.id,
        debit: amount,
        description: "Reversal of income",
      },
      { accountId: bank.id, credit: amount, description: "Refund paid out" },
    ],
  });
}

// ---------------------------------------------------------------------
// 6. Loan Write-Off
// ---------------------------------------------------------------------
export async function postWriteOff({
  loanApplicationId,
  amount,
  writeOffDate,
  narration,
}) {
  const [badDebt, loanReceivable] = await Promise.all([
    getBySystemKey(KEYS.BAD_DEBT_EXPENSE),
    getBySystemKey(KEYS.LOAN_RECEIVABLE),
  ]);

  return createJournal({
    narration: narration ?? `Write-off of loan ${loanApplicationId}`,
    referenceType: "WRITE_OFF",
    referenceId: loanApplicationId,
    transactionDate: writeOffDate ?? new Date(),
    lines: [
      { accountId: badDebt.id, debit: amount, description: "Bad debt expense" },
      {
        accountId: loanReceivable.id,
        credit: amount,
        description: "Loan receivable written off",
      },
    ],
  });
}

// ---------------------------------------------------------------------
// 7. Recovery / Settlement collection (post-default recovery payment)
// ---------------------------------------------------------------------
export async function postRecoveryPayment({
  recoveryPaymentId,
  loanRecoveryId,
  loanApplicationId,
  customerId,
  amount,
  paymentDate,
  narration,
  paymentMode = "CASH",
}) {
  const [bank, loanReceivable] = await Promise.all([
    getBySystemKey(KEYS.BANK_ACCOUNT),
    getBySystemKey(KEYS.LOAN_RECEIVABLE),
  ]);

  let resolvedRecoveryPaymentId = recoveryPaymentId;
  let resolvedLoanRecoveryId = loanRecoveryId;

  if (!resolvedRecoveryPaymentId) {
    if (!resolvedLoanRecoveryId) {
      if (!loanApplicationId || !customerId) {
        throw new Error(
          "Provide recoveryPaymentId, or loanRecoveryId, or (loanApplicationId + customerId) to create one",
        );
      }
      const recovery = await prisma.loanRecovery.create({
        data: {
          loanApplicationId,
          customerId,
          totalOutstandingAmount: amount,
          recoveredAmount: 0,
          balanceAmount: amount,
        },
      });
      resolvedLoanRecoveryId = recovery.id;
    }
    const payment = await prisma.recoveryPayment.create({
      data: {
        loanRecoveryId: resolvedLoanRecoveryId,
        amount,
        paymentDate: paymentDate ?? new Date(),
        paymentMode,
      },
    });
    resolvedRecoveryPaymentId = payment.id;
  }

  const entry = await createJournal({
    narration: narration ?? `Recovery payment for loan ${loanApplicationId}`,
    referenceType: "RECOVERY",
    referenceId: loanApplicationId,
    transactionDate: paymentDate ?? new Date(),
    lines: [
      {
        accountId: bank.id,
        debit: amount,
        description: "Recovery amount received",
      },
      {
        accountId: loanReceivable.id,
        credit: amount,
        description: "Loan receivable recovered",
      },
    ],
  });

  await prisma.recoveryPayment.update({
    where: { id: resolvedRecoveryPaymentId },
    data: { accountingStatus: "POSTED" },
  });

  return entry;
}






// typescript code  👇👇

// import prisma from "../lib/prisma.js";
// import { createJournal, JournalLineInput, JournalCreateInput } from "./journalService.js";
// import { getBySystemKey } from "./accountService.js";
// import KEYS from "../utils/systemAccounts.js";
// import { Prisma } from "@prisma/client";

// // ============================================================================
// // Type Definitions
// // ============================================================================

// export interface LoanDisbursementInput {
//   loanDisbursementId?: string;
//   loanApplicationId: string;
//   amount: number;
//   disbursementDate?: Date | string;
//   narration?: string;
//   branchId?: string;
//   disbursementMode?: "BANK_TRANSFER" | "CASH" | "CHEQUE";
// }

// export interface EmiCollectionInput {
//   emiPaymentId?: string;
//   emiScheduleId?: string;
//   loanApplicationId?: string;
//   principalAmount?: number;
//   interestAmount?: number;
//   penaltyAmount?: number;
//   bounceAmount?: number;
//   paymentDate?: Date | string;
//   narration?: string;
//   paymentMode?: "UPI" | "CASH" | "BANK_TRANSFER" | "CHEQUE";
// }

// export interface PenaltyCollectionInput {
//   referenceId: string;
//   amount: number;
//   collectionDate?: Date | string;
//   narration?: string;
// }

// export interface ProcessingFeeInput {
//   loanApplicationId: string;
//   amount: number;
//   collectedImmediately?: boolean;
//   feeDate?: Date | string;
//   narration?: string;
// }

// export interface RefundInput {
//   referenceId: string;
//   amount: number;
//   refundDate?: Date | string;
//   reason?: string;
//   narration?: string;
// }

// export interface WriteOffInput {
//   loanApplicationId: string;
//   amount: number;
//   writeOffDate?: Date | string;
//   narration?: string;
// }

// export interface RecoveryPaymentInput {
//   recoveryPaymentId?: string;
//   loanRecoveryId?: string;
//   loanApplicationId?: string;
//   customerId?: string;
//   amount: number;
//   paymentDate?: Date | string;
//   narration?: string;
//   paymentMode?: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
// }

// export interface JournalEntryResponse {
//   id: string;
//   // Add other fields as needed
// }

// // ============================================================================
// // Error Classes
// // ============================================================================

// export class AutoPostingError extends Error {
//   public readonly status: number;
  
//   constructor(message: string, status: number = 400) {
//     super(message);
//     this.name = "AutoPostingError";
//     this.status = status;
//   }
// }

// // ============================================================================
// // Helper Types
// // ============================================================================

// type DisbursementMode = "BANK_TRANSFER" | "CASH" | "CHEQUE";
// type PaymentMode = "UPI" | "CASH" | "BANK_TRANSFER" | "CHEQUE";

// // ============================================================================
// // 1. Loan Disbursement
// // ============================================================================

// export async function postLoanDisbursement({
//   loanDisbursementId,
//   loanApplicationId,
//   amount,
//   disbursementDate,
//   narration,
//   branchId,
//   disbursementMode = "BANK_TRANSFER",
// }: LoanDisbursementInput): Promise<JournalEntryResponse> {
//   const [loanReceivable, bank] = await Promise.all([
//     getBySystemKey(KEYS.LOAN_RECEIVABLE),
//     getBySystemKey(KEYS.BANK_ACCOUNT),
//   ]);

//   // If no LoanDisbursement row exists yet (e.g. a real caller creates it
//   // first and only then triggers accounting), create a minimal one here —
//   // convenient for demos/tests hitting this endpoint directly.
//   let resolvedDisbursementId = loanDisbursementId;
//   if (!resolvedDisbursementId) {
//     const loanApp = await prisma.loanApplication.findUnique({
//       where: { id: loanApplicationId },
//     });
//     if (!loanApp) {
//       throw new AutoPostingError(`LoanApplication ${loanApplicationId} not found`, 404);
//     }
//     const disbursement = await prisma.loanDisbursement.create({
//       data: {
//         loanApplicationId,
//         amount,
//         principalAmount: amount,
//         disbursementMode: disbursementMode as any,
//         transactionReference: `DISB-${Date.now()}`,
//         branchId: branchId ?? loanApp.branchId,
//       },
//     });
//     resolvedDisbursementId = disbursement.id;
//   }

//   const entry = await createJournal({
//     narration: narration ?? `Loan disbursement for application ${loanApplicationId}`,
//     referenceType: "LOAN_DISBURSEMENT",
//     referenceId: loanApplicationId,
//     transactionDate: disbursementDate ? new Date(disbursementDate) : new Date(),
//     loanDisbursementId: resolvedDisbursementId,
//     lines: [
//       {
//         accountId: loanReceivable.id,
//         debit: amount,
//         credit: 0,
//         description: "Loan principal receivable",
//       },
//       {
//         accountId: bank.id,
//         debit: 0,
//         credit: amount,
//         description: "Funds disbursed from bank",
//       },
//     ],
//   });

//   await prisma.loanDisbursement.update({
//     where: { id: resolvedDisbursementId },
//     data: { accountingStatus: "POSTED" },
//   });

//   return entry;
// }

// // ============================================================================
// // 2. EMI Collection (principal + interest + optional penalty/bounce)
// // ============================================================================

// export async function postEmiCollection({
//   emiPaymentId,
//   emiScheduleId,
//   loanApplicationId,
//   principalAmount = 0,
//   interestAmount = 0,
//   penaltyAmount = 0,
//   bounceAmount = 0,
//   paymentDate,
//   narration,
//   paymentMode = "UPI",
// }: EmiCollectionInput): Promise<JournalEntryResponse> {
//   const total = principalAmount + interestAmount + penaltyAmount + bounceAmount;
//   if (total <= 0) {
//     throw new AutoPostingError("EMI collection amount must be greater than zero");
//   }

//   let resolvedEmiPaymentId = emiPaymentId;
//   if (!resolvedEmiPaymentId) {
//     if (!emiScheduleId) {
//       throw new AutoPostingError("Provide either emiPaymentId or emiScheduleId");
//     }
//     const payment = await prisma.emiPayment.create({
//       data: {
//         emiScheduleId,
//         amount: total,
//         principalPaid: principalAmount,
//         interestPaid: interestAmount,
//         penaltyPaid: penaltyAmount,
//         bouncePaid: bounceAmount,
//         paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
//         paymentMode: paymentMode as any,
//       },
//     });
//     resolvedEmiPaymentId = payment.id;
//   }

//   const needed = [
//     KEYS.BANK_ACCOUNT,
//     KEYS.LOAN_RECEIVABLE,
//     KEYS.INTEREST_INCOME,
//   ];
//   if (penaltyAmount > 0) needed.push(KEYS.PENALTY_INCOME);
//   if (bounceAmount > 0) needed.push(KEYS.BOUNCE_CHARGE_INCOME);

//   const accounts = Object.fromEntries(
//     await Promise.all(
//       needed.map(async (key) => [key, await getBySystemKey(key)]),
//     ),
//   );

//   const lines: JournalLineInput[] = [
//     {
//       accountId: accounts[KEYS.BANK_ACCOUNT].id,
//       debit: total,
//       credit: 0,
//       description: "EMI received",
//     },
//   ];
  
//   if (principalAmount > 0) {
//     lines.push({
//       accountId: accounts[KEYS.LOAN_RECEIVABLE].id,
//       debit: 0,
//       credit: principalAmount,
//       description: "Principal component",
//     });
//   }
//   if (interestAmount > 0) {
//     lines.push({
//       accountId: accounts[KEYS.INTEREST_INCOME].id,
//       debit: 0,
//       credit: interestAmount,
//       description: "Interest component",
//     });
//   }
//   if (penaltyAmount > 0) {
//     lines.push({
//       accountId: accounts[KEYS.PENALTY_INCOME].id,
//       debit: 0,
//       credit: penaltyAmount,
//       description: "Late payment penalty",
//     });
//   }
//   if (bounceAmount > 0) {
//     lines.push({
//       accountId: accounts[KEYS.BOUNCE_CHARGE_INCOME].id,
//       debit: 0,
//       credit: bounceAmount,
//       description: "Bounce charges",
//     });
//   }

//   const entry = await createJournal({
//     narration: narration ?? `EMI collection for loan ${loanApplicationId}`,
//     referenceType: "EMI_PAYMENT",
//     referenceId: resolvedEmiPaymentId,
//     transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
//     lines,
//   });

//   await prisma.emiPayment.update({
//     where: { id: resolvedEmiPaymentId },
//     data: { accountingStatus: "POSTED", journalEntryId: entry.id },
//   });

//   return entry;
// }

// // ============================================================================
// // 3. Standalone Penalty Collection
// // ============================================================================

// export async function postPenaltyCollection({
//   referenceId,
//   amount,
//   collectionDate,
//   narration,
// }: PenaltyCollectionInput): Promise<JournalEntryResponse> {
//   const [bank, penaltyIncome] = await Promise.all([
//     getBySystemKey(KEYS.BANK_ACCOUNT),
//     getBySystemKey(KEYS.PENALTY_INCOME),
//   ]);

//   return createJournal({
//     narration: narration ?? `Penalty collected for ${referenceId}`,
//     referenceType: "PENALTY",
//     referenceId,
//     transactionDate: collectionDate ? new Date(collectionDate) : new Date(),
//     lines: [
//       {
//         accountId: bank.id,
//         debit: amount,
//         credit: 0,
//         description: "Penalty received",
//       },
//       {
//         accountId: penaltyIncome.id,
//         debit: 0,
//         credit: amount,
//         description: "Penalty income",
//       },
//     ],
//   });
// }

// // ============================================================================
// // 4. Processing Fee
// // ============================================================================

// export async function postProcessingFee({
//   loanApplicationId,
//   amount,
//   collectedImmediately = true,
//   feeDate,
//   narration,
// }: ProcessingFeeInput): Promise<JournalEntryResponse> {
//   const [debitAccount, feeIncome] = await Promise.all([
//     getBySystemKey(
//       collectedImmediately ? KEYS.BANK_ACCOUNT : KEYS.CUSTOMER_RECEIVABLE,
//     ),
//     getBySystemKey(KEYS.PROCESSING_FEE_INCOME),
//   ]);

//   return createJournal({
//     narration: narration ?? `Processing fee for loan ${loanApplicationId}`,
//     referenceType: "PROCESSING_FEE",
//     referenceId: loanApplicationId,
//     transactionDate: feeDate ? new Date(feeDate) : new Date(),
//     lines: [
//       {
//         accountId: debitAccount.id,
//         debit: amount,
//         credit: 0,
//         description: collectedImmediately
//           ? "Processing fee collected"
//           : "Processing fee receivable",
//       },
//       {
//         accountId: feeIncome.id,
//         debit: 0,
//         credit: amount,
//         description: "Processing fee income",
//       },
//     ],
//   });
// }

// // ============================================================================
// // 5. Refund
// // ============================================================================

// export async function postRefund({
//   referenceId,
//   amount,
//   refundDate,
//   reason,
//   narration,
// }: RefundInput): Promise<JournalEntryResponse> {
//   const [bank, feeIncome] = await Promise.all([
//     getBySystemKey(KEYS.BANK_ACCOUNT),
//     getBySystemKey(KEYS.PROCESSING_FEE_INCOME),
//   ]);

//   return createJournal({
//     narration: narration ?? `Refund: ${reason ?? referenceId}`,
//     referenceType: "REFUND",
//     referenceId,
//     transactionDate: refundDate ? new Date(refundDate) : new Date(),
//     lines: [
//       {
//         accountId: feeIncome.id,
//         debit: amount,
//         credit: 0,
//         description: "Reversal of income",
//       },
//       {
//         accountId: bank.id,
//         debit: 0,
//         credit: amount,
//         description: "Refund paid out",
//       },
//     ],
//   });
// }

// // ============================================================================
// // 6. Loan Write-Off
// // ============================================================================

// export async function postWriteOff({
//   loanApplicationId,
//   amount,
//   writeOffDate,
//   narration,
// }: WriteOffInput): Promise<JournalEntryResponse> {
//   const [badDebt, loanReceivable] = await Promise.all([
//     getBySystemKey(KEYS.BAD_DEBT_EXPENSE),
//     getBySystemKey(KEYS.LOAN_RECEIVABLE),
//   ]);

//   return createJournal({
//     narration: narration ?? `Write-off of loan ${loanApplicationId}`,
//     referenceType: "WRITE_OFF",
//     referenceId: loanApplicationId,
//     transactionDate: writeOffDate ? new Date(writeOffDate) : new Date(),
//     lines: [
//       {
//         accountId: badDebt.id,
//         debit: amount,
//         credit: 0,
//         description: "Bad debt expense",
//       },
//       {
//         accountId: loanReceivable.id,
//         debit: 0,
//         credit: amount,
//         description: "Loan receivable written off",
//       },
//     ],
//   });
// }

// // ============================================================================
// // 7. Recovery / Settlement Collection
// // ============================================================================

// export async function postRecoveryPayment({
//   recoveryPaymentId,
//   loanRecoveryId,
//   loanApplicationId,
//   customerId,
//   amount,
//   paymentDate,
//   narration,
//   paymentMode = "CASH",
// }: RecoveryPaymentInput): Promise<JournalEntryResponse> {
//   const [bank, loanReceivable] = await Promise.all([
//     getBySystemKey(KEYS.BANK_ACCOUNT),
//     getBySystemKey(KEYS.LOAN_RECEIVABLE),
//   ]);

//   let resolvedRecoveryPaymentId = recoveryPaymentId;
//   let resolvedLoanRecoveryId = loanRecoveryId;

//   if (!resolvedRecoveryPaymentId) {
//     if (!resolvedLoanRecoveryId) {
//       if (!loanApplicationId || !customerId) {
//         throw new AutoPostingError(
//           "Provide recoveryPaymentId, or loanRecoveryId, or (loanApplicationId + customerId) to create one",
//           400,
//         );
//       }
//       const recovery = await prisma.loanRecovery.create({
//         data: {
//           loanApplicationId,
//           customerId,
//           totalOutstandingAmount: amount,
//           recoveredAmount: 0,
//           balanceAmount: amount,
//         },
//       });
//       resolvedLoanRecoveryId = recovery.id;
//     }
//     const payment = await prisma.recoveryPayment.create({
//       data: {
//         loanRecoveryId: resolvedLoanRecoveryId,
//         amount,
//         paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
//         paymentMode: paymentMode as any,
//       },
//     });
//     resolvedRecoveryPaymentId = payment.id;
//   }

//   const entry = await createJournal({
//     narration: narration ?? `Recovery payment for loan ${loanApplicationId}`,
//     referenceType: "RECOVERY",
//     referenceId: loanApplicationId,
//     transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
//     lines: [
//       {
//         accountId: bank.id,
//         debit: amount,
//         credit: 0,
//         description: "Recovery amount received",
//       },
//       {
//         accountId: loanReceivable.id,
//         debit: 0,
//         credit: amount,
//         description: "Loan receivable recovered",
//       },
//     ],
//   });

//   await prisma.recoveryPayment.update({
//     where: { id: resolvedRecoveryPaymentId },
//     data: { accountingStatus: "POSTED" },
//   });

//   return entry;
// }

// // ============================================================================
// // Utility Functions
// // ============================================================================

// export function validateDisbursementInput(data: LoanDisbursementInput): void {
//   if (!data.loanApplicationId) {
//     throw new AutoPostingError("loanApplicationId is required", 400);
//   }
//   if (!data.amount || data.amount <= 0) {
//     throw new AutoPostingError("Amount must be greater than zero", 400);
//   }
// }

// export function validateEmiCollectionInput(data: EmiCollectionInput): void {
//   const total = (data.principalAmount || 0) + 
//                 (data.interestAmount || 0) + 
//                 (data.penaltyAmount || 0) + 
//                 (data.bounceAmount || 0);
//   if (total <= 0) {
//     throw new AutoPostingError("Total collection amount must be greater than zero", 400);
//   }
// }

// export function validatePenaltyInput(data: PenaltyCollectionInput): void {
//   if (!data.referenceId) {
//     throw new AutoPostingError("referenceId is required", 400);
//   }
//   if (!data.amount || data.amount <= 0) {
//     throw new AutoPostingError("Amount must be greater than zero", 400);
//   }
// }

// export function validateProcessingFeeInput(data: ProcessingFeeInput): void {
//   if (!data.loanApplicationId) {
//     throw new AutoPostingError("loanApplicationId is required", 400);
//   }
//   if (!data.amount || data.amount <= 0) {
//     throw new AutoPostingError("Amount must be greater than zero", 400);
//   }
// }

// export function validateRefundInput(data: RefundInput): void {
//   if (!data.referenceId) {
//     throw new AutoPostingError("referenceId is required", 400);
//   }
//   if (!data.amount || data.amount <= 0) {
//     throw new AutoPostingError("Amount must be greater than zero", 400);
//   }
// }

// export function validateWriteOffInput(data: WriteOffInput): void {
//   if (!data.loanApplicationId) {
//     throw new AutoPostingError("loanApplicationId is required", 400);
//   }
//   if (!data.amount || data.amount <= 0) {
//     throw new AutoPostingError("Amount must be greater than zero", 400);
//   }
// }

// export function validateRecoveryPaymentInput(data: RecoveryPaymentInput): void {
//   if (!data.amount || data.amount <= 0) {
//     throw new AutoPostingError("Amount must be greater than zero", 400);
//   }
//   // Either recoveryPaymentId, loanRecoveryId, or (loanApplicationId + customerId) must be provided
//   if (!data.recoveryPaymentId && !data.loanRecoveryId && !(data.loanApplicationId && data.customerId)) {
//     throw new AutoPostingError(
//       "Provide recoveryPaymentId, or loanRecoveryId, or (loanApplicationId + customerId)",
//       400
//     );
//   }
// }