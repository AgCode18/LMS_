// Seeds the Chart of Accounts exactly as listed in the accounting spec's
// "Sample Chart of Accounts" table, plus a couple of accounts the auto
// posting rules need (Customer Receivable, Bounce Charge Income, Bad
// Debt Expense) that the PDF describes in prose but doesn't code-number.
//
// SAFE TO RUN IN PRODUCTION. This is not test data — a real system needs
// these ledger accounts to exist before any journal entry can post
// against them. Run this once when setting up a new environment.
// Re-running it is harmless: it upserts by account code, so it will
// never create duplicates or wipe out balances you've already posted.

import { PrismaClient } from '@prisma/client';
import KEYS from '../src/utils/systemAccounts.js';

const prisma = new PrismaClient();

const ACCOUNTS = [
  { code: '1001', name: 'Bank Account', type: 'ASSET', systemKey: KEYS.BANK_ACCOUNT },
  { code: '1002', name: 'Cash Account', type: 'ASSET', systemKey: KEYS.CASH_ACCOUNT },
  { code: '1100', name: 'Loan Receivable', type: 'ASSET', systemKey: KEYS.LOAN_RECEIVABLE },
  { code: '1101', name: 'Customer Receivable', type: 'ASSET', systemKey: KEYS.CUSTOMER_RECEIVABLE },
  { code: '2001', name: 'Security Deposit', type: 'LIABILITY', systemKey: KEYS.SECURITY_DEPOSIT },
  { code: '3001', name: 'Capital Account', type: 'EQUITY', systemKey: KEYS.CAPITAL_ACCOUNT },
  { code: '4001', name: 'Interest Income', type: 'INCOME', systemKey: KEYS.INTEREST_INCOME },
  { code: '4002', name: 'Processing Fee Income', type: 'INCOME', systemKey: KEYS.PROCESSING_FEE_INCOME },
  { code: '4003', name: 'Penalty Income', type: 'INCOME', systemKey: KEYS.PENALTY_INCOME },
  { code: '4004', name: 'Bounce Charge Income', type: 'INCOME', systemKey: KEYS.BOUNCE_CHARGE_INCOME },
  { code: '5001', name: 'Salary Expense', type: 'EXPENSE', systemKey: KEYS.SALARY_EXPENSE },
  { code: '5002', name: 'Bad Debt Expense', type: 'EXPENSE', systemKey: KEYS.BAD_DEBT_EXPENSE },
];

try {
  for (const acc of ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: acc.code },
      create: { ...acc, openingBalance: 0, currentBalance: 0 },
      update: { name: acc.name, type: acc.type, systemKey: acc.systemKey },
    });
    console.log(`✓ ${acc.code} ${acc.name}`);
  }
  console.log('\nChart of Accounts seeded. Safe to re-run any time.');
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
