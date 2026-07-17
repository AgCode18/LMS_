import prisma from "../lib/prisma.js";
import * as autoPosting from "./autoPostingService.js";

export class LifecycleError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.name = "LifecycleError";
    this.status = status;
    this.details = details;
  }
}

// ---------------------------------------------------------------------
// Disbursement eligibility — verifies KYC, Sanction and NACH before a
// loan is allowed to be disbursed. This is the "automatic status-check
// workflow" you asked for: nothing gets disbursed until all three gates
// pass, and re-disbursement on an already-disbursed loan is blocked too.
// ---------------------------------------------------------------------

export async function checkDisbursementEligibility(loanApplicationId) {
  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanApplicationId },
    include: {
      kyc: true,
      sanctions: { orderBy: { createdAt: "desc" }, take: 1 },
      nachMandates: { orderBy: { createdAt: "desc" }, take: 1 },
      loanDisbursement: true,
    },
  });

  if (!loan) throw new LifecycleError("Loan application not found", 404);

  const reasons = [];

  if (loan.kyc?.status !== "VERIFIED") {
    reasons.push(
      `KYC is ${loan.kyc?.status ?? "not started"}, must be VERIFIED`,
    );
  }

  const latestSanction = loan.sanctions[0];
  if (latestSanction?.status !== "APPROVED") {
    reasons.push(
      `Sanction is ${latestSanction?.status ?? "not created"}, must be APPROVED`,
    );
  }

  const latestNach = loan.nachMandates[0];
  if (latestNach?.status !== "ACTIVE") {
    reasons.push(
      `NACH mandate is ${latestNach?.status ?? "not created"}, must be ACTIVE`,
    );
  }

  const alreadyDisbursed = loan.loanDisbursement.some(
    (d) => d.accountingStatus === "POSTED",
  );
  if (alreadyDisbursed) {
    reasons.push("This loan application already has a posted disbursement");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    loan,
    sanction: latestSanction,
    nach: latestNach,
  };
}

// ---------------------------------------------------------------------
// 1. Loan Disbursement
// ---------------------------------------------------------------------
export async function disburseLoan({
  loanApplicationId,
  disbursementMode,
  bankName,
  bankAccountNumber,
  ifscCode,
  accountHolderName,
  transactionReference,
  processedBy,
}) {
  const eligibility = await checkDisbursementEligibility(loanApplicationId);
  if (!eligibility.eligible) {
    throw new LifecycleError(
      "Loan is not eligible for disbursement yet",
      422,
      eligibility.reasons,
    );
  }

  const { loan } = eligibility;
  const amount = loan.approvedAmount ?? loan.requestedAmount;

  // Step 1: the LMS-side record, in its own transaction.
  const disbursement = await prisma.$transaction(async (tx) => {
    const created = await tx.loanDisbursement.create({
      data: {
        loanApplicationId,
        amount,
        principalAmount: amount,
        disbursementMode,
        disbursementStatus: "COMPLETED",
        transactionReference:
          transactionReference ?? `DISB-${loanApplicationId}-${Date.now()}`,
        bankName,
        bankAccountNumber,
        ifscCode,
        accountHolderName,
        processedBy,
        branchId: loan.branchId,
      },
    });

    await tx.loanApplication.update({
      where: { id: loanApplicationId },
      data: { status: "ACTIVE" },
    });

    return created;
  });

  // Step 2: hand off to the accounting engine — this is the automatic part.
  const journalEntry = await autoPosting.postLoanDisbursement({
    loanDisbursementId: disbursement.id,
    loanApplicationId,
    amount,
    disbursementDate: disbursement.disbursementDate,
  });

  return { disbursement, journalEntry };
}

// ---------------------------------------------------------------------
// 2. EMI Collection
// ---------------------------------------------------------------------
export async function collectEmi({
  emiScheduleId,
  principalAmount = 0,
  interestAmount = 0,
  penaltyAmount = 0,
  bounceAmount = 0,
  paymentMode,
  transactionReference,
  processedById,
  branchId,
}) {
  const schedule = await prisma.loanEmiSchedule.findUnique({
    where: { id: emiScheduleId },
  });
  if (!schedule) throw new LifecycleError("EMI schedule not found", 404);
  if (schedule.status === "paid")
    throw new LifecycleError("This EMI has already been marked paid", 409);

  const total = principalAmount + interestAmount + penaltyAmount + bounceAmount;

  const emiPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.emiPayment.create({
      data: {
        emiScheduleId,
        amount: total,
        principalPaid: principalAmount,
        interestPaid: interestAmount,
        penaltyPaid: penaltyAmount,
        bouncePaid: bounceAmount,
        paymentDate: new Date(),
        paymentMode,
        transactionReference,
        processedById,
        branchId,
      },
    });

    await tx.loanEmiSchedule.update({
      where: { id: emiScheduleId },
      data: { status: "paid" },
    });

    return payment;
  });

  const journalEntry = await autoPosting.postEmiCollection({
    emiPaymentId: emiPayment.id,
    loanApplicationId: schedule.loanApplicationId,
    principalAmount,
    interestAmount,
    penaltyAmount,
    bounceAmount,
    paymentDate: emiPayment.paymentDate,
  });

  return { emiPayment, journalEntry };
}

// ---------------------------------------------------------------------
// 3. Standalone penalty collection (outside a regular EMI)
// ---------------------------------------------------------------------
export async function collectPenalty({ loanApplicationId, amount }) {
  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanApplicationId },
  });
  if (!loan) throw new LifecycleError("Loan application not found", 404);

  const journalEntry = await autoPosting.postPenaltyCollection({
    referenceId: loanApplicationId,
    amount,
  });

  return { journalEntry };
}

// ---------------------------------------------------------------------
// 4. Processing fee
// ---------------------------------------------------------------------
export async function chargeProcessingFee({
  loanApplicationId,
  amount,
  collectedImmediately = true,
}) {
  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanApplicationId },
  });
  if (!loan) throw new LifecycleError("Loan application not found", 404);

  await prisma.loanApplication.update({
    where: { id: loanApplicationId },
    data: { processingFees: amount },
  });

  const journalEntry = await autoPosting.postProcessingFee({
    loanApplicationId,
    amount,
    collectedImmediately,
  });

  return { journalEntry };
}

// ---------------------------------------------------------------------
// 5. Refund
// ---------------------------------------------------------------------
export async function issueRefund({ referenceId, amount, reason }) {
  const journalEntry = await autoPosting.postRefund({
    referenceId,
    amount,
    reason,
  });
  return { journalEntry };
}

// ---------------------------------------------------------------------
// 6. Write-off
// ---------------------------------------------------------------------
export async function writeOffLoan({ loanApplicationId, amount }) {
  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanApplicationId },
  });
  if (!loan) throw new LifecycleError("Loan application not found", 404);
  if (loan.status === "WRITTEN_OFF")
    throw new LifecycleError("Loan is already written off", 409);

  await prisma.loanApplication.update({
    where: { id: loanApplicationId },
    data: { status: "WRITTEN_OFF" },
  });

  const journalEntry = await autoPosting.postWriteOff({
    loanApplicationId,
    amount,
  });

  return { journalEntry };
}

// ---------------------------------------------------------------------
// 7. Recovery payment
// ---------------------------------------------------------------------
export async function recordRecoveryPayment({
  loanRecoveryId,
  amount,
  paymentMode,
  referenceNo,
}) {
  const recovery = await prisma.loanRecovery.findUnique({
    where: { id: loanRecoveryId },
  });
  if (!recovery)
    throw new LifecycleError("Loan recovery record not found", 404);
  if (amount > recovery.balanceAmount) {
    throw new LifecycleError(
      `Amount ${amount} exceeds outstanding balance ${recovery.balanceAmount}`,
      422,
    );
  }

  const recoveryPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.recoveryPayment.create({
      data: {
        loanRecoveryId,
        amount,
        paymentDate: new Date(),
        paymentMode,
        referenceNo,
      },
    });

    await tx.loanRecovery.update({
      where: { id: loanRecoveryId },
      data: {
        recoveredAmount: { increment: amount },
        balanceAmount: { decrement: amount },
      },
    });

    return payment;
  });

  const journalEntry = await autoPosting.postRecoveryPayment({
    recoveryPaymentId: recoveryPayment.id,
    loanApplicationId: recovery.loanApplicationId,
    amount,
    paymentDate: recoveryPayment.paymentDate,
  });

  return { recoveryPayment, journalEntry };
}





// Typescript code  👇👇





// import prisma from "../lib/prisma.js";
// import * as autoPosting from "./autoPostingService.js";
// import { Prisma, PrismaClient } from "@prisma/client";

// // ============================================================================
// // Types & Interfaces
// // ============================================================================

// export interface DisbursementEligibilityResult {
//   eligible: boolean;
//   reasons: string[];
//   loan: any; // Replace with proper Prisma type
//   sanction: any; // Replace with proper Prisma type
//   nach: any; // Replace with proper Prisma type
// }

// export interface DisbursementInput {
//   loanApplicationId: string;
//   disbursementMode: string;
//   bankName: string;
//   bankAccountNumber: string;
//   ifscCode: string;
//   accountHolderName: string;
//   transactionReference?: string;
//   processedBy: string;
// }

// export interface DisbursementResult {
//   disbursement: any; // Replace with proper Prisma type
//   journalEntry: any; // Replace with proper Prisma type
// }

// export interface EmiCollectionInput {
//   emiScheduleId: string;
//   principalAmount?: number;
//   interestAmount?: number;
//   penaltyAmount?: number;
//   bounceAmount?: number;
//   paymentMode: string;
//   transactionReference?: string;
//   processedById: string;
//   branchId: string;
// }

// export interface EmiCollectionResult {
//   emiPayment: any; // Replace with proper Prisma type
//   journalEntry: any; // Replace with proper Prisma type
// }

// export interface PenaltyCollectionInput {
//   loanApplicationId: string;
//   amount: number;
// }

// export interface ProcessingFeeInput {
//   loanApplicationId: string;
//   amount: number;
//   collectedImmediately?: boolean;
// }

// export interface RefundInput {
//   referenceId: string;
//   amount: number;
//   reason: string;
// }

// export interface WriteOffInput {
//   loanApplicationId: string;
//   amount: number;
// }

// export interface RecoveryPaymentInput {
//   loanRecoveryId: string;
//   amount: number;
//   paymentMode: string;
//   referenceNo: string;
// }

// // ============================================================================
// // Custom Error Class
// // ============================================================================

// export class LifecycleError extends Error {
//   public readonly status: number;
//   public readonly details?: string[];

//   constructor(message: string, status: number = 400, details?: string[]) {
//     super(message);
//     this.name = "LifecycleError";
//     this.status = status;
//     this.details = details;
//   }
// }

// // ============================================================================
// // 1. Disbursement Eligibility Check
// // ============================================================================

// /**
//  * Checks if a loan application is eligible for disbursement
//  * @param loanApplicationId - The ID of the loan application
//  * @returns Eligibility result with reasons if not eligible
//  * @throws {LifecycleError} If loan application not found
//  */
// export async function checkDisbursementEligibility(
//   loanApplicationId: string
// ): Promise<DisbursementEligibilityResult> {
//   const loan = await prisma.loanApplication.findUnique({
//     where: { id: loanApplicationId },
//     include: {
//       kyc: true,
//       sanctions: { orderBy: { createdAt: "desc" }, take: 1 },
//       nachMandates: { orderBy: { createdAt: "desc" }, take: 1 },
//       loanDisbursement: true,
//     },
//   });

//   if (!loan) {
//     throw new LifecycleError("Loan application not found", 404);
//   }

//   const reasons: string[] = [];

//   // Check KYC status
//   if (loan.kyc?.status !== "VERIFIED") {
//     reasons.push(
//       `KYC is ${loan.kyc?.status ?? "not started"}, must be VERIFIED`
//     );
//   }

//   // Check sanction status
//   const latestSanction = loan.sanctions[0];
//   if (latestSanction?.status !== "APPROVED") {
//     reasons.push(
//       `Sanction is ${latestSanction?.status ?? "not created"}, must be APPROVED`
//     );
//   }

//   // Check NACH mandate status
//   const latestNach = loan.nachMandates[0];
//   if (latestNach?.status !== "ACTIVE") {
//     reasons.push(
//       `NACH mandate is ${latestNach?.status ?? "not created"}, must be ACTIVE`
//     );
//   }

//   // Check if already disbursed
//   const alreadyDisbursed = loan.loanDisbursement.some(
//     (d: any) => d.accountingStatus === "POSTED"
//   );
//   if (alreadyDisbursed) {
//     reasons.push("This loan application already has a posted disbursement");
//   }

//   return {
//     eligible: reasons.length === 0,
//     reasons,
//     loan,
//     sanction: latestSanction,
//     nach: latestNach,
//   };
// }

// // ============================================================================
// // 2. Loan Disbursement
// // ============================================================================

// /**
//  * Disburses a loan after eligibility check
//  * @param input - Disbursement input parameters
//  * @returns Disbursement and journal entry details
//  * @throws {LifecycleError} If loan is not eligible or not found
//  */
// export async function disburseLoan(
//   input: DisbursementInput
// ): Promise<DisbursementResult> {
//   const {
//     loanApplicationId,
//     disbursementMode,
//     bankName,
//     bankAccountNumber,
//     ifscCode,
//     accountHolderName,
//     transactionReference,
//     processedBy,
//   } = input;

//   const eligibility = await checkDisbursementEligibility(loanApplicationId);
//   if (!eligibility.eligible) {
//     throw new LifecycleError(
//       "Loan is not eligible for disbursement yet",
//       422,
//       eligibility.reasons
//     );
//   }

//   const { loan } = eligibility;
//   const amount = loan.approvedAmount ?? loan.requestedAmount;

//   // Step 1: Create disbursement record in transaction
//   const disbursement = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
//     const created = await tx.loanDisbursement.create({
//       data: {
//         loanApplicationId,
//         amount,
//         principalAmount: amount,
//         disbursementMode,
//         disbursementStatus: "COMPLETED",
//         transactionReference:
//           transactionReference ?? `DISB-${loanApplicationId}-${Date.now()}`,
//         bankName,
//         bankAccountNumber,
//         ifscCode,
//         accountHolderName,
//         processedBy,
//         branchId: loan.branchId,
//       },
//     });

//     await tx.loanApplication.update({
//       where: { id: loanApplicationId },
//       data: { status: "ACTIVE" },
//     });

//     return created;
//   });

//   // Step 2: Create accounting journal entry
//   const journalEntry = await autoPosting.postLoanDisbursement({
//     loanDisbursementId: disbursement.id,
//     loanApplicationId,
//     amount,
//     disbursementDate: disbursement.disbursementDate,
//   });

//   return { disbursement, journalEntry };
// }

// // ============================================================================
// // 3. EMI Collection
// // ============================================================================

// /**
//  * Collects EMI payment and creates accounting entries
//  * @param input - EMI collection input parameters
//  * @returns EMI payment and journal entry details
//  * @throws {LifecycleError} If EMI schedule not found or already paid
//  */
// export async function collectEmi(
//   input: EmiCollectionInput
// ): Promise<EmiCollectionResult> {
//   const {
//     emiScheduleId,
//     principalAmount = 0,
//     interestAmount = 0,
//     penaltyAmount = 0,
//     bounceAmount = 0,
//     paymentMode,
//     transactionReference,
//     processedById,
//     branchId,
//   } = input;

//   const schedule = await prisma.loanEmiSchedule.findUnique({
//     where: { id: emiScheduleId },
//   });

//   if (!schedule) {
//     throw new LifecycleError("EMI schedule not found", 404);
//   }

//   if (schedule.status === "paid") {
//     throw new LifecycleError("This EMI has already been marked paid", 409);
//   }

//   const total = principalAmount + interestAmount + penaltyAmount + bounceAmount;

//   const emiPayment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
//     const payment = await tx.emiPayment.create({
//       data: {
//         emiScheduleId,
//         amount: total,
//         principalPaid: principalAmount,
//         interestPaid: interestAmount,
//         penaltyPaid: penaltyAmount,
//         bouncePaid: bounceAmount,
//         paymentDate: new Date(),
//         paymentMode,
//         transactionReference,
//         processedById,
//         branchId,
//       },
//     });

//     await tx.loanEmiSchedule.update({
//       where: { id: emiScheduleId },
//       data: { status: "paid" },
//     });

//     return payment;
//   });

//   const journalEntry = await autoPosting.postEmiCollection({
//     emiPaymentId: emiPayment.id,
//     loanApplicationId: schedule.loanApplicationId,
//     principalAmount,
//     interestAmount,
//     penaltyAmount,
//     bounceAmount,
//     paymentDate: emiPayment.paymentDate,
//   });

//   return { emiPayment, journalEntry };
// }

// // ============================================================================
// // 4. Standalone Penalty Collection
// // ============================================================================

// /**
//  * Collects penalty outside of regular EMI
//  * @param input - Penalty collection input
//  * @returns Journal entry details
//  * @throws {LifecycleError} If loan application not found
//  */
// export async function collectPenalty(
//   input: PenaltyCollectionInput
// ): Promise<{ journalEntry: any }> {
//   const { loanApplicationId, amount } = input;

//   const loan = await prisma.loanApplication.findUnique({
//     where: { id: loanApplicationId },
//   });

//   if (!loan) {
//     throw new LifecycleError("Loan application not found", 404);
//   }

//   const journalEntry = await autoPosting.postPenaltyCollection({
//     referenceId: loanApplicationId,
//     amount,
//   });

//   return { journalEntry };
// }

// // ============================================================================
// // 5. Processing Fee
// // ============================================================================

// /**
//  * Charges processing fee for a loan application
//  * @param input - Processing fee input
//  * @returns Journal entry details
//  * @throws {LifecycleError} If loan application not found
//  */
// export async function chargeProcessingFee(
//   input: ProcessingFeeInput
// ): Promise<{ journalEntry: any }> {
//   const { loanApplicationId, amount, collectedImmediately = true } = input;

//   const loan = await prisma.loanApplication.findUnique({
//     where: { id: loanApplicationId },
//   });

//   if (!loan) {
//     throw new LifecycleError("Loan application not found", 404);
//   }

//   await prisma.loanApplication.update({
//     where: { id: loanApplicationId },
//     data: { processingFees: amount },
//   });

//   const journalEntry = await autoPosting.postProcessingFee({
//     loanApplicationId,
//     amount,
//     collectedImmediately,
//   });

//   return { journalEntry };
// }

// // ============================================================================
// // 6. Refund
// // ============================================================================

// /**
//  * Issues a refund
//  * @param input - Refund input
//  * @returns Journal entry details
//  */
// export async function issueRefund(
//   input: RefundInput
// ): Promise<{ journalEntry: any }> {
//   const { referenceId, amount, reason } = input;

//   const journalEntry = await autoPosting.postRefund({
//     referenceId,
//     amount,
//     reason,
//   });

//   return { journalEntry };
// }

// // ============================================================================
// // 7. Write-off
// // ============================================================================

// /**
//  * Writes off a loan
//  * @param input - Write-off input
//  * @returns Journal entry details
//  * @throws {LifecycleError} If loan not found or already written off
//  */
// export async function writeOffLoan(
//   input: WriteOffInput
// ): Promise<{ journalEntry: any }> {
//   const { loanApplicationId, amount } = input;

//   const loan = await prisma.loanApplication.findUnique({
//     where: { id: loanApplicationId },
//   });

//   if (!loan) {
//     throw new LifecycleError("Loan application not found", 404);
//   }

//   if (loan.status === "WRITTEN_OFF") {
//     throw new LifecycleError("Loan is already written off", 409);
//   }

//   await prisma.loanApplication.update({
//     where: { id: loanApplicationId },
//     data: { status: "WRITTEN_OFF" },
//   });

//   const journalEntry = await autoPosting.postWriteOff({
//     loanApplicationId,
//     amount,
//   });

//   return { journalEntry };
// }

// // ============================================================================
// // 8. Recovery Payment
// // ============================================================================

// /**
//  * Records a recovery payment
//  * @param input - Recovery payment input
//  * @returns Recovery payment and journal entry details
//  * @throws {LifecycleError} If recovery record not found or amount exceeds balance
//  */
// export async function recordRecoveryPayment(
//   input: RecoveryPaymentInput
// ): Promise<{ recoveryPayment: any; journalEntry: any }> {
//   const { loanRecoveryId, amount, paymentMode, referenceNo } = input;

//   const recovery = await prisma.loanRecovery.findUnique({
//     where: { id: loanRecoveryId },
//   });

//   if (!recovery) {
//     throw new LifecycleError("Loan recovery record not found", 404);
//   }

//   if (amount > recovery.balanceAmount) {
//     throw new LifecycleError(
//       `Amount ${amount} exceeds outstanding balance ${recovery.balanceAmount}`,
//       422
//     );
//   }

//   const recoveryPayment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
//     const payment = await tx.recoveryPayment.create({
//       data: {
//         loanRecoveryId,
//         amount,
//         paymentDate: new Date(),
//         paymentMode,
//         referenceNo,
//       },
//     });

//     await tx.loanRecovery.update({
//       where: { id: loanRecoveryId },
//       data: {
//         recoveredAmount: { increment: amount },
//         balanceAmount: { decrement: amount },
//       },
//     });

//     return payment;
//   });

//   const journalEntry = await autoPosting.postRecoveryPayment({
//     recoveryPaymentId: recoveryPayment.id,
//     loanApplicationId: recovery.loanApplicationId,
//     amount,
//     paymentDate: recoveryPayment.paymentDate,
//   });

//   return { recoveryPayment, journalEntry };
// }

// // ============================================================================
// // Export all functions
// // ============================================================================

// export default {
//   LifecycleError,
//   checkDisbursementEligibility,
//   disburseLoan,
//   collectEmi,
//   collectPenalty,
//   chargeProcessingFee,
//   issueRefund,
//   writeOffLoan,
//   recordRecoveryPayment,
// };