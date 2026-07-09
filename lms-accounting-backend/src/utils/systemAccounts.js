// Central place for the "systemKey" strings used to look up accounts
// without ever hardcoding an account id or code in business logic.
// This mirrors the schema comment: "it will not hardcode account codes".
const SYSTEM_ACCOUNTS = Object.freeze({
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  CASH_ACCOUNT: 'CASH_ACCOUNT',
  LOAN_RECEIVABLE: 'LOAN_RECEIVABLE',
  CUSTOMER_RECEIVABLE: 'CUSTOMER_RECEIVABLE',
  SECURITY_DEPOSIT: 'SECURITY_DEPOSIT',
  CAPITAL_ACCOUNT: 'CAPITAL_ACCOUNT',
  INTEREST_INCOME: 'INTEREST_INCOME',
  PROCESSING_FEE_INCOME: 'PROCESSING_FEE_INCOME',
  PENALTY_INCOME: 'PENALTY_INCOME',
  BOUNCE_CHARGE_INCOME: 'BOUNCE_CHARGE_INCOME',
  SALARY_EXPENSE: 'SALARY_EXPENSE',
  BAD_DEBT_EXPENSE: 'BAD_DEBT_EXPENSE',
});

export default SYSTEM_ACCOUNTS;
