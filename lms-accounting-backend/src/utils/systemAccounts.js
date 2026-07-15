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



// typescript code 👇


// ============================================================================
// System Accounts Configuration
// ============================================================================

// /**
//  * Central place for the "systemKey" strings used to look up accounts
//  * without ever hardcoding an account id or code in business logic.
//  * This mirrors the schema comment: "it will not hardcode account codes".
//  * 
//  * These keys are used to reference system accounts that are required for
//  * the accounting engine to function properly. Each key corresponds to a
//  * specific account type in the Chart of Accounts.
//  */
// const SYSTEM_ACCOUNTS = Object.freeze({
//   /** Primary bank account for all financial transactions */
//   BANK_ACCOUNT: 'BANK_ACCOUNT',
  
//   /** Cash account for physical cash transactions */
//   CASH_ACCOUNT: 'CASH_ACCOUNT',
  
//   /** Loan receivable account for tracking outstanding loans */
//   LOAN_RECEIVABLE: 'LOAN_RECEIVABLE',
  
//   /** Customer receivable account for tracking amounts owed by customers */
//   CUSTOMER_RECEIVABLE: 'CUSTOMER_RECEIVABLE',
  
//   /** Security deposit account for customer security deposits */
//   SECURITY_DEPOSIT: 'SECURITY_DEPOSIT',
  
//   /** Capital account for owner's/company's capital */
//   CAPITAL_ACCOUNT: 'CAPITAL_ACCOUNT',
  
//   /** Interest income account for tracking interest earned */
//   INTEREST_INCOME: 'INTEREST_INCOME',
  
//   /** Processing fee income account for tracking processing fees */
//   PROCESSING_FEE_INCOME: 'PROCESSING_FEE_INCOME',
  
//   /** Penalty income account for tracking late payment penalties */
//   PENALTY_INCOME: 'PENALTY_INCOME',
  
//   /** Bounce charge income account for tracking bounced cheque charges */
//   BOUNCE_CHARGE_INCOME: 'BOUNCE_CHARGE_INCOME',
  
//   /** Salary expense account for employee salaries */
//   SALARY_EXPENSE: 'SALARY_EXPENSE',
  
//   /** Bad debt expense account for writing off unrecoverable loans */
//   BAD_DEBT_EXPENSE: 'BAD_DEBT_EXPENSE',
// } as const);

// // ============================================================================
// // Type Definitions
// // ============================================================================

// /**
//  * Type for all system account keys
//  * @example 'BANK_ACCOUNT' | 'CASH_ACCOUNT' | ...
//  */
// export type SystemAccountKey = keyof typeof SYSTEM_ACCOUNTS;

// /**
//  * Type for all system account values (the actual string values)
//  * @example 'BANK_ACCOUNT' | 'CASH_ACCOUNT' | ...
//  */
// export type SystemAccountValue = typeof SYSTEM_ACCOUNTS[SystemAccountKey];

// /**
//  * Type for the entire system accounts object
//  */
// export type SystemAccounts = typeof SYSTEM_ACCOUNTS;

// // ============================================================================
// // Exports
// // ============================================================================

// export default SYSTEM_ACCOUNTS;

// // ============================================================================
// // Optional: Additional Utility Functions
// // ============================================================================

// /**
//  * Get all system account keys as an array
//  */
// export const getSystemAccountKeys = (): SystemAccountKey[] => {
//   return Object.keys(SYSTEM_ACCOUNTS) as SystemAccountKey[];
// };

// /**
//  * Get all system account values as an array
//  */
// export const getSystemAccountValues = (): SystemAccountValue[] => {
//   return Object.values(SYSTEM_ACCOUNTS);
// };

// /**
//  * Check if a given key is a valid system account key
//  */
// export const isValidSystemAccountKey = (
//   key: string
// ): key is SystemAccountKey => {
//   return key in SYSTEM_ACCOUNTS;
// };

// /**
//  * Check if a given value is a valid system account value
//  */
// export const isValidSystemAccountValue = (
//   value: string
// ): value is SystemAccountValue => {
//   return Object.values(SYSTEM_ACCOUNTS).includes(value as SystemAccountValue);
// };

// /**
//  * Get the system account key by its value
//  */
// export const getSystemAccountKeyByValue = (
//   value: string
// ): SystemAccountKey | undefined => {
//   const entry = Object.entries(SYSTEM_ACCOUNTS).find(
//     ([_, val]) => val === value
//   );
//   return entry ? (entry[0] as SystemAccountKey) : undefined;
// };

// /**
//  * Get system account info for documentation
//  */
// export const getSystemAccountInfo = () => {
//   return Object.entries(SYSTEM_ACCOUNTS).map(([key, value]) => ({
//     key,
//     value,
//     description: getAccountDescription(key as SystemAccountKey),
//   }));
// };

// /**
//  * Get description for a system account key
//  */
// const getAccountDescription = (key: SystemAccountKey): string => {
//   const descriptions: Record<SystemAccountKey, string> = {
//     BANK_ACCOUNT: 'BANK_ACCOUNT',
//     CASH_ACCOUNT: 'CASH_ACCOUNT',
//     LOAN_RECEIVABLE: 'LOAN_RECEIVABLE',
//     CUSTOMER_RECEIVABLE: 'CUSTOMER_RECEIVABLE',
//     SECURITY_DEPOSIT: 'SECURITY_DEPOSIT',
//     CAPITAL_ACCOUNT: 'CAPITAL_ACCOUNT',
//     INTEREST_INCOME: 'INTEREST_INCOME',
//     PROCESSING_FEE_INCOME: 'PROCESSING_FEE_INCOME',
//     PENALTY_INCOME: 'PENALTY_INCOME',
//     BOUNCE_CHARGE_INCOME: 'BOUNCE_CHARGE_INCOME',
//     SALARY_EXPENSE: 'SALARY_EXPENSE',
//     BAD_DEBT_EXPENSE: 'BAD_DEBT_EXPENSE',
//   };
//   return descriptions[key];
// };

// // ============================================================================
// // Type Exports
// // ============================================================================

// export type {
//   SystemAccountKey,
//   SystemAccountValue,
//   SystemAccounts,
// };