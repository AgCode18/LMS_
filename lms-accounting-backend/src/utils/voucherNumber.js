/**
 * Produces sequential voucher numbers like JV-2026-000001, scoped per
 * calendar year, using an atomic upsert+increment against VoucherCounter.
 * Must be called from inside the same transaction that creates the
 * JournalEntry, so two concurrent postings can never receive the same number.
 */

export async function nextVoucherNumber(tx, transactionDate = new Date()) {
  const year = transactionDate.getFullYear();

  const counter = await tx.voucherCounter.upsert({
    where: { year },
    create: { year, sequence: 1 },
    update: { sequence: { increment: 1 } },
  });

  const padded = String(counter.sequence).padStart(6, '0');
  return `JV-${year}-${padded}`;
}


// typescript code 




// import { Prisma } from '@prisma/client';

// // ============================================================================
// // Type Definitions
// // ============================================================================

// /**
//  * Transaction client type for Prisma
//  */
// type TransactionClient = Prisma.TransactionClient;

// /**
//  * Options for generating voucher numbers
//  */
// interface VoucherNumberOptions {
//   /**
//    * The date to generate the voucher number for
//    * @default new Date()
//    */
//   transactionDate?: Date;
//   /**
//    * Prefix for the voucher number
//    * @default 'JV'
//    */
//   prefix?: string;
//   /**
//    * Number of digits for the sequence (padded with leading zeros)
//    * @default 6
//    */
//   paddingLength?: number;
// }

// // ============================================================================
// // Main Function
// // ============================================================================

// /**
//  * Produces sequential voucher numbers like JV-2026-000001, scoped per
//  * calendar year, using an atomic upsert+increment against VoucherCounter.
//  * Must be called from inside the same transaction that creates the
//  * JournalEntry, so two concurrent postings can never receive the same number.
//  * 
//  * @param tx - Prisma transaction client
//  * @param transactionDate - Date for the voucher year (defaults to now)
//  * @returns Sequential voucher number string
//  * 
//  * @example
//  * ```typescript
//  * // Inside a transaction
//  * await prisma.$transaction(async (tx) => {
//  *   const voucherNo = await nextVoucherNumber(tx, new Date());
//  *   // use voucherNo to create journal entry
//  * });
//  * ```
//  */
// export async function nextVoucherNumber(
//   tx: TransactionClient,
//   transactionDate: Date = new Date()
// ): Promise<string> {
//   const year = transactionDate.getFullYear();

//   const counter = await tx.voucherCounter.upsert({
//     where: { year },
//     create: { year, sequence: 1 },
//     update: { sequence: { increment: 1 } },
//   });

//   const padded = String(counter.sequence).padStart(6, '0');
//   return `JV-${year}-${padded}`;
// }

// // ============================================================================
// // Extended Version with Options
// // ============================================================================

// /**
//  * Extended version of nextVoucherNumber with additional options
//  * 
//  * @param tx - Prisma transaction client
//  * @param options - Configuration options
//  * @returns Sequential voucher number string
//  * 
//  * @example
//  * ```typescript
//  * // Custom prefix and padding
//  * const voucherNo = await nextVoucherNumberWithOptions(tx, {
//  *   transactionDate: new Date(),
//  *   prefix: 'INV',
//  *   paddingLength: 8
//  * });
//  * // Returns: INV-2026-00000001
//  * ```
//  */
// export async function nextVoucherNumberWithOptions(
//   tx: TransactionClient,
//   options: VoucherNumberOptions = {}
// ): Promise<string> {
//   const {
//     transactionDate = new Date(),
//     prefix = 'JV',
//     paddingLength = 6,
//   } = options;

//   const year = transactionDate.getFullYear();

//   // Use a composite key with prefix and year for different voucher types
//   const counter = await tx.voucherCounter.upsert({
//     where: { 
//       year,
//       // If your schema supports it, you could add a prefix field
//       // For now, we'll use year as the unique key
//     },
//     create: { year, sequence: 1 },
//     update: { sequence: { increment: 1 } },
//   });

//   const padded = String(counter.sequence).padStart(paddingLength, '0');
//   return `${prefix}-${year}-${padded}`;
// }

// // ============================================================================
// // Alternative: Multi-Type Voucher Number Generator
// // ============================================================================

// /**
//  * Voucher types for different document types
//  */
// export type VoucherType = 'JV' | 'INV' | 'REC' | 'PAY' | 'CN' | 'DN';

// /**
//  * Generates voucher numbers for different document types
//  * with separate counters per type and year
//  * 
//  * @param tx - Prisma transaction client
//  * @param voucherType - Type of voucher (JV, INV, REC, etc.)
//  * @param transactionDate - Date for the voucher year
//  * @returns Sequential voucher number string
//  * 
//  * @example
//  * ```typescript
//  * // Generate an invoice number
//  * const invoiceNo = await nextVoucherNumberByType(tx, 'INV', new Date());
//  * // Returns: INV-2026-000001
//  * ```
//  */
// export async function nextVoucherNumberByType(
//   tx: TransactionClient,
//   voucherType: VoucherType = 'JV',
//   transactionDate: Date = new Date()
// ): Promise<string> {
//   const year = transactionDate.getFullYear();

//   // Assuming your VoucherCounter model has voucherType field
//   // If not, you'll need to modify your schema
//   const counter = await tx.voucherCounter.upsert({
//     where: {
//       // Composite key: year + voucherType
//       // For now, using year only as per the original implementation
//       year,
//     },
//     create: { 
//       year, 
//       sequence: 1,
//       // voucherType // Add this to your schema
//     },
//     update: { 
//       sequence: { increment: 1 } 
//     },
//   });

//   const padded = String(counter.sequence).padStart(6, '0');
//   return `${voucherType}-${year}-${padded}`;
// }

// // ============================================================================
// // Batch Voucher Number Generation
// // ============================================================================

// /**
//  * Generate multiple voucher numbers in a single call
//  * Useful for batch operations
//  * 
//  * @param tx - Prisma transaction client
//  * @param count - Number of voucher numbers to generate
//  * @param transactionDate - Date for the voucher year
//  * @returns Array of voucher number strings
//  * 
//  * @example
//  * ```typescript
//  * const numbers = await generateMultipleVoucherNumbers(tx, 5);
//  * // Returns: ['JV-2026-000001', 'JV-2026-000002', ...]
//  * ```
//  */
// export async function generateMultipleVoucherNumbers(
//   tx: TransactionClient,
//   count: number,
//   transactionDate: Date = new Date()
// ): Promise<string[]> {
//   if (count < 1) {
//     throw new Error('Count must be at least 1');
//   }

//   const year = transactionDate.getFullYear();
//   const numbers: string[] = [];

//   // Generate sequentially in a single transaction
//   for (let i = 0; i < count; i++) {
//     const counter = await tx.voucherCounter.upsert({
//       where: { year },
//       create: { year, sequence: 1 },
//       update: { sequence: { increment: 1 } },
//     });

//     const padded = String(counter.sequence).padStart(6, '0');
//     numbers.push(`JV-${year}-${padded}`);
//   }

//   return numbers;
// }

// // ============================================================================
// // Utility Functions
// // ============================================================================

// /**
//  * Format a sequence number with padding
//  * 
//  * @param sequence - The sequence number
//  * @param paddingLength - Number of digits (default: 6)
//  * @returns Padded string
//  */
// export const formatVoucherSequence = (
//   sequence: number,
//   paddingLength: number = 6
// ): string => {
//   return String(sequence).padStart(paddingLength, '0');
// };

// /**
//  * Parse a voucher number to extract components
//  * 
//  * @param voucherNo - The voucher number string
//  * @returns Object with prefix, year, and sequence
//  * 
//  * @example
//  * ```typescript
//  * const parsed = parseVoucherNumber('JV-2026-000001');
//  * // { prefix: 'JV', year: '2026', sequence: '000001', sequenceNumber: 1 }
//  * ```
//  */
// export const parseVoucherNumber = (
//   voucherNo: string
// ): {
//   prefix: string;
//   year: string;
//   sequence: string;
//   sequenceNumber: number;
// } => {
//   const parts = voucherNo.split('-');
//   if (parts.length !== 3) {
//     throw new Error('Invalid voucher number format. Expected: PREFIX-YYYY-SEQUENCE');
//   }

//   const [prefix, year, sequence] = parts;
//   const sequenceNumber = parseInt(sequence, 10);

//   if (isNaN(sequenceNumber)) {
//     throw new Error('Invalid sequence number in voucher');
//   }

//   return {
//     prefix,
//     year,
//     sequence,
//     sequenceNumber,
//   };
// };

// /**
//  * Validate a voucher number format
//  * 
//  * @param voucherNo - The voucher number to validate
//  * @returns True if valid
//  */
// export const isValidVoucherNumber = (voucherNo: string): boolean => {
//   const pattern = /^[A-Z]{2,4}-\d{4}-\d{6}$/;
//   return pattern.test(voucherNo);
// };

// /**
//  * Get the next sequence number from a voucher number
//  * 
//  * @param voucherNo - The voucher number
//  * @returns The sequence number
//  */
// export const getSequenceFromVoucherNumber = (voucherNo: string): number => {
//   const parts = voucherNo.split('-');
//   if (parts.length !== 3) {
//     throw new Error('Invalid voucher number format');
//   }
//   return parseInt(parts[2], 10);
// };

// // ============================================================================
// // Export Types
// // ============================================================================

// export type { TransactionClient, VoucherNumberOptions };