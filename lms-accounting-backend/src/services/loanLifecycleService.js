import prisma from '../lib/prisma.js';
import * as autoPosting from './autoPostingService.js';

export class LifecycleError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.name = 'LifecycleError';
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
      sanctions: { orderBy: { createdAt: 'desc' }, take: 1 },
      nachMandates: { orderBy: { createdAt: 'desc' }, take: 1 },
      loanDisbursement: true,
    },
  });

  if (!loan) throw new LifecycleError('Loan application not found', 404);

  const reasons = [];

  if (loan.kyc?.status !== 'VERIFIED') {
    reasons.push(`KYC is ${loan.kyc?.status ?? 'not started'}, must be VERIFIED`);
  }

  const latestSanction = loan.sanctions[0];
  if (latestSanction?.status !== 'APPROVED') {
    reasons.push(`Sanction is ${latestSanction?.status ?? 'not created'}, must be APPROVED`);
  }

  const latestNach = loan.nachMandates[0];
  if (latestNach?.status !== 'ACTIVE') {
    reasons.push(`NACH mandate is ${latestNach?.status ?? 'not created'}, must be ACTIVE`);
  }

  const alreadyDisbursed = loan.loanDisbursement.some((d) => d.accountingStatus === 'POSTED');
  if (alreadyDisbursed) {
    reasons.push('This loan application already has a posted disbursement');
  }

  return { eligible: reasons.length === 0, reasons, loan, sanction: latestSanction, nach: latestNach };
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
    throw new LifecycleError('Loan is not eligible for disbursement yet', 422, eligibility.reasons);
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
        disbursementStatus: 'COMPLETED',
        transactionReference: transactionReference ?? `DISB-${loanApplicationId}-${Date.now()}`,
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
      data: { status: 'ACTIVE' },
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
  const schedule = await prisma.loanEmiSchedule.findUnique({ where: { id: emiScheduleId } });
  if (!schedule) throw new LifecycleError('EMI schedule not found', 404);
  if (schedule.status === 'paid') throw new LifecycleError('This EMI has already been marked paid', 409);

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

    await tx.loanEmiSchedule.update({ where: { id: emiScheduleId }, data: { status: 'paid' } });

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
  const loan = await prisma.loanApplication.findUnique({ where: { id: loanApplicationId } });
  if (!loan) throw new LifecycleError('Loan application not found', 404);

  const journalEntry = await autoPosting.postPenaltyCollection({
    referenceId: loanApplicationId,
    amount,
  });

  return { journalEntry };
}

// ---------------------------------------------------------------------
// 4. Processing fee
// ---------------------------------------------------------------------
export async function chargeProcessingFee({ loanApplicationId, amount, collectedImmediately = true }) {
  const loan = await prisma.loanApplication.findUnique({ where: { id: loanApplicationId } });
  if (!loan) throw new LifecycleError('Loan application not found', 404);

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
  const journalEntry = await autoPosting.postRefund({ referenceId, amount, reason });
  return { journalEntry };
}

// ---------------------------------------------------------------------
// 6. Write-off
// ---------------------------------------------------------------------
export async function writeOffLoan({ loanApplicationId, amount }) {
  const loan = await prisma.loanApplication.findUnique({ where: { id: loanApplicationId } });
  if (!loan) throw new LifecycleError('Loan application not found', 404);
  if (loan.status === 'WRITTEN_OFF') throw new LifecycleError('Loan is already written off', 409);

  await prisma.loanApplication.update({
    where: { id: loanApplicationId },
    data: { status: 'WRITTEN_OFF' },
  });

  const journalEntry = await autoPosting.postWriteOff({ loanApplicationId, amount });

  return { journalEntry };
}

// ---------------------------------------------------------------------
// 7. Recovery payment
// ---------------------------------------------------------------------
export async function recordRecoveryPayment({ loanRecoveryId, amount, paymentMode, referenceNo }) {
  const recovery = await prisma.loanRecovery.findUnique({ where: { id: loanRecoveryId } });
  if (!recovery) throw new LifecycleError('Loan recovery record not found', 404);
  if (amount > recovery.balanceAmount) {
    throw new LifecycleError(`Amount ${amount} exceeds outstanding balance ${recovery.balanceAmount}`, 422);
  }

  const recoveryPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.recoveryPayment.create({
      data: { loanRecoveryId, amount, paymentDate: new Date(), paymentMode, referenceNo },
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
