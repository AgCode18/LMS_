import asyncHandler from '../middleware/asyncHandler.js';
import * as journalService from '../services/journalService.js';
import { toXlsxBuffer, toPdfBuffer } from '../services/exportService.js';

export const list = asyncHandler(async (req, res) => {
  const { referenceType, status, from, to, accountSearch, page, pageSize } = req.query;
  res.json(
    await journalService.listJournalEntries({
      referenceType,
      status,
      from,
      to,
      accountSearch,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  );
});

export const exportList = asyncHandler(async (req, res) => {
  const { referenceType, status, from, to, accountSearch, format } = req.query;
  // No pagination on export — pull everything matching the filters (capped
  // generously so an accidental unfiltered export can't hang the server).
  const result = await journalService.listJournalEntries({
    referenceType,
    status,
    from,
    to,
    accountSearch,
    page: 1,
    pageSize: 5000,
  });
  const columns = [
    { key: 'voucherNo', header: 'Voucher' },
    { key: 'date', header: 'Date' },
    { key: 'narration', header: 'Narration' },
    { key: 'referenceType', header: 'Reference' },
    { key: 'totalDebit', header: 'Debit', numeric: true },
    { key: 'totalCredit', header: 'Credit', numeric: true },
    { key: 'status', header: 'Status' },
  ];
  const rows = result.data.map((e) => ({
    voucherNo: e.voucherNo,
    date: new Date(e.transactionDate).toLocaleDateString('en-IN'),
    narration: e.narration ?? '',
    referenceType: e.referenceType ?? '',
    totalDebit: e.totalDebit,
    totalCredit: e.totalCredit,
    status: e.status,
  }));

  if (format === 'pdf') {
    const buffer = await toPdfBuffer('Journal Entries', columns, rows, { subtitle: `${result.total} voucher(s)` });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="journal-entries.pdf"');
    return res.send(buffer);
  }
  const buffer = await toXlsxBuffer('Journal Entries', columns, rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="journal-entries.xlsx"');
  return res.send(buffer);
});

export const get = asyncHandler(async (req, res) => {
  res.json(await journalService.getJournalEntry(req.params.id));
});

// Manual journal entry — for adjustments the auto-posting rules don't cover
// (e.g. salary expense, capital infusion). Mirrors createJournal() directly.
export const create = asyncHandler(async (req, res) => {
  const { narration, referenceType, referenceId, lines, transactionDate, status, createdById } = req.body;
  const entry = await journalService.createJournal({
    narration,
    referenceType,
    referenceId,
    lines,
    transactionDate: transactionDate ? new Date(transactionDate) : undefined,
    status: status ?? 'POSTED',
    createdById,
  });
  res.status(201).json(entry);
});

export const post = asyncHandler(async (req, res) => {
  res.json(await journalService.postDraft(req.params.id));
});

export const cancel = asyncHandler(async (req, res) => {
  res.json(await journalService.cancelJournal(req.params.id));
});



// Typescript code  👇


// import { Request, Response } from 'express';
// import asyncHandler from '../middleware/asyncHandler.js';
// import * as journalService from '../services/journalService.js';
// import { toXlsxBuffer, toPdfBuffer } from '../services/exportService.js';

// export const list = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { referenceType, status, from, to, accountSearch, page, pageSize } = req.query;
//     res.json(
//       await journalService.listJournalEntries({
//         referenceType: referenceType as string,
//         status: status as string,
//         from: from as string,
//         to: to as string,
//         accountSearch: accountSearch as string,
//         page: page ? Number(page) : undefined,
//         pageSize: pageSize ? Number(pageSize) : undefined,
//       })
//     );
//   }
// );

// export const exportList = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { referenceType, status, from, to, accountSearch, format } = req.query;
    
//     const result = await journalService.listJournalEntries({
//       referenceType: referenceType as string,
//       status: status as string,
//       from: from as string,
//       to: to as string,
//       accountSearch: accountSearch as string,
//       page: 1,
//       pageSize: 5000,
//     });
    
//     const columns = [
//       { key: 'voucherNo', header: 'Voucher' },
//       { key: 'date', header: 'Date' },
//       { key: 'narration', header: 'Narration' },
//       { key: 'referenceType', header: 'Reference' },
//       { key: 'totalDebit', header: 'Debit', numeric: true },
//       { key: 'totalCredit', header: 'Credit', numeric: true },
//       { key: 'status', header: 'Status' },
//     ];
    
//     const rows = result.data.map((e: any) => ({
//       voucherNo: e.voucherNo,
//       date: new Date(e.transactionDate).toLocaleDateString('en-IN'),
//       narration: e.narration ?? '',
//       referenceType: e.referenceType ?? '',
//       totalDebit: e.totalDebit,
//       totalCredit: e.totalCredit,
//       status: e.status,
//     }));

//     if (format === 'pdf') {
//       const buffer = await toPdfBuffer('Journal Entries', columns, rows, { 
//         subtitle: `${result.total} voucher(s)` 
//       });
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'attachment; filename="journal-entries.pdf"');
//       return res.send(buffer);
//     }
    
//     const buffer = await toXlsxBuffer('Journal Entries', columns, rows);
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', 'attachment; filename="journal-entries.xlsx"');
//     return res.send(buffer);
//   }
// );

// export const get = asyncHandler(
//   async (req: Request<{ id: string }>, res: Response) => {
//     res.json(await journalService.getJournalEntry(req.params.id));
//   }
// );

// export const create = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { narration, referenceType, referenceId, lines, transactionDate, status, createdById } = req.body;
//     const entry = await journalService.createJournal({
//       narration,
//       referenceType,
//       referenceId,
//       lines,
//       transactionDate: transactionDate ? new Date(transactionDate) : undefined,
//       status: status ?? 'POSTED',
//       createdById,
//     });
//     res.status(201).json(entry);
//   }
// );

// export const post = asyncHandler(
//   async (req: Request<{ id: string }>, res: Response) => {
//     res.json(await journalService.postDraft(req.params.id));
//   }
// );

// export const cancel = asyncHandler(
//   async (req: Request<{ id: string }>, res: Response) => {
//     res.json(await journalService.cancelJournal(req.params.id));
//   }
// );