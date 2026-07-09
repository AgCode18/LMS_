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
