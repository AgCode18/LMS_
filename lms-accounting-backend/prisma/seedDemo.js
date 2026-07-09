// Seeds a demo branch/customer/loan application/KYC/Sanction/NACH/EMI
// schedule/recovery record so you have real ids to test the accounting
// engine and loan lifecycle endpoints against on a fresh database.
//
// DEV/TESTING ONLY — DO NOT RUN THIS AGAINST PRODUCTION. In production,
// this data comes from your real leads/KYC/loan-application/NACH flows,
// not from a script. Run `seedCoa.js` there instead.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const branch = await prisma.branch.upsert({
    where: { code: 'HO-001' },
    create: { name: 'Head Office', code: 'HO-001' },
    update: {},
  });

  const customer = await prisma.customer.upsert({
    where: { id: 'demo-customer-1' },
    create: {
      id: 'demo-customer-1',
      firstName: 'Asha',
      lastName: 'Verma',
      contactNumber: '9999900000',
      email: 'asha.verma@example.com',
    },
    update: {},
  });

  const kyc = await prisma.kyc.upsert({
    where: { id: 'demo-kyc-1' },
    create: { id: 'demo-kyc-1', status: 'VERIFIED', verifiedAt: new Date() },
    update: { status: 'VERIFIED' },
  });

  const loanApplication = await prisma.loanApplication.upsert({
    where: { loanNumber: 'LN-2026-0001' },
    create: {
      loanNumber: 'LN-2026-0001',
      customerId: customer.id,
      branchId: branch.id,
      requestedAmount: 50000,
      approvedAmount: 50000,
      status: 'SANCTION_APPROVED',
      kycId: kyc.id,
    },
    update: { kycId: kyc.id },
  });

  await prisma.sanction.upsert({
    where: { id: 'demo-sanction-1' },
    create: {
      id: 'demo-sanction-1',
      loanApplicationNumber: loanApplication.loanNumber,
      sanctionedAmount: 50000,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: 'demo-admin',
    },
    update: { status: 'APPROVED' },
  });

  await prisma.nachMandate.upsert({
    where: { id: 'demo-nach-1' },
    create: {
      id: 'demo-nach-1',
      loanApplicationId: loanApplication.id,
      customerId: customer.id,
      status: 'ACTIVE',
      maxDebitAmount: 10000,
    },
    update: { status: 'ACTIVE' },
  });

  const emiSchedule = await prisma.loanEmiSchedule.upsert({
    where: { id: 'demo-emi-1' },
    create: {
      id: 'demo-emi-1',
      loanApplicationId: loanApplication.id,
      emiNo: 1,
      dueDate: new Date(),
      emiAmount: 5000,
    },
    update: {},
  });

  const loanRecovery = await prisma.loanRecovery.upsert({
    where: { id: 'demo-recovery-1' },
    create: {
      id: 'demo-recovery-1',
      loanApplicationId: loanApplication.id,
      customerId: customer.id,
      totalOutstandingAmount: 20000,
      recoveredAmount: 0,
      balanceAmount: 20000,
    },
    update: {},
  });

  console.log(`\nDemo data ready — KYC verified, Sanction approved, NACH active`);
  console.log(`(this loan will PASS the disbursement eligibility check):\n`);
  console.log(`  loanApplicationId: ${loanApplication.id}  (loanNumber ${loanApplication.loanNumber})`);
  console.log(`  customerId:        ${customer.id}`);
  console.log(`  branchId:          ${branch.id}`);
  console.log(`  emiScheduleId:     ${emiSchedule.id}`);
  console.log(`  loanRecoveryId:    ${loanRecovery.id}`);
  console.log(`\nTry: POST /api/loans/${loanApplication.id}/disburse`);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
