import asyncHandler from "../middleware/asyncHandler.js";
import * as reportService from "../services/reportService.js";
import { toXlsxBuffer, toPdfBuffer } from "../services/exportService.js";

const sendExport = async (
  res,
  format,
  filenameBase,
  title,
  columns,
  rows,
  subtitle,
) => {
  if (format === "pdf") {
    const buffer = await toPdfBuffer(title, columns, rows, { subtitle });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filenameBase}.pdf"`,
    );
    return res.send(buffer);
  }
  const buffer = await toXlsxBuffer(title, columns, rows);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filenameBase}.xlsx"`,
  );
  return res.send(buffer);
};

export const trialBalance = asyncHandler(async (req, res) => {
  res.json(await reportService.trialBalance({ asOf: req.query.asOf }));
});

export const trialBalanceExport = asyncHandler(async (req, res) => {
  const tb = await reportService.trialBalance({ asOf: req.query.asOf });
  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Account" },
    { key: "type", header: "Type" },
    { key: "totalDebit", header: "Total Debit", numeric: true },
    { key: "totalCredit", header: "Total Credit", numeric: true },
    { key: "closingBalance", header: "Closing Balance", numeric: true },
  ];
  await sendExport(
    res,
    req.query.format,
    "trial-balance",
    "Trial Balance",
    columns,
    tb.rows,
    `As of ${tb.asOf}`,
  );
});

export const accountLedger = asyncHandler(async (req, res) => {
  res.json(
    await reportService.accountLedger(req.params.accountId, {
      from: req.query.from,
      to: req.query.to,
    }),
  );
});

export const accountLedgerExport = asyncHandler(async (req, res) => {
  const ledger = await reportService.accountLedger(req.params.accountId, {
    from: req.query.from,
    to: req.query.to,
  });
  const columns = [
    { key: "date", header: "Date" },
    { key: "voucherNo", header: "Voucher" },
    { key: "narration", header: "Narration" },
    { key: "debit", header: "Debit", numeric: true },
    { key: "credit", header: "Credit", numeric: true },
    { key: "runningBalance", header: "Running Balance", numeric: true },
  ];
  const rows = ledger.rows.map((r) => ({
    ...r,
    date: new Date(r.date).toLocaleDateString("en-IN"),
  }));
  await sendExport(
    res,
    req.query.format,
    "account-ledger",
    `Ledger — ${ledger.account.code} ${ledger.account.name}`,
    columns,
    rows,
  );
});

export const profitAndLoss = asyncHandler(async (req, res) => {
  res.json(
    await reportService.profitAndLoss({
      from: req.query.from,
      to: req.query.to,
    }),
  );
});

export const profitAndLossExport = asyncHandler(async (req, res) => {
  const pnl = await reportService.profitAndLoss({
    from: req.query.from,
    to: req.query.to,
  });
  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Account" },
    { key: "section", header: "Section" },
    { key: "amount", header: "Amount", numeric: true },
  ];
  const rows = [
    ...pnl.income.map((r) => ({ ...r, section: "Income" })),
    ...pnl.expense.map((r) => ({ ...r, section: "Expense" })),
    { code: "", name: "Net Profit", section: "", amount: pnl.netProfit },
  ];
  await sendExport(
    res,
    req.query.format,
    "profit-and-loss",
    "Profit & Loss Statement",
    columns,
    rows,
    `${pnl.from ?? "inception"} to ${pnl.to ?? "date"}`,
  );
});

export const balanceSheet = asyncHandler(async (req, res) => {
  res.json(await reportService.balanceSheet({ asOf: req.query.asOf }));
});

export const balanceSheetExport = asyncHandler(async (req, res) => {
  const bs = await reportService.balanceSheet({ asOf: req.query.asOf });
  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Account" },
    { key: "section", header: "Section" },
    { key: "closingBalance", header: "Balance", numeric: true },
  ];
  const rows = [
    ...bs.assets.map((r) => ({ ...r, section: "Asset" })),
    ...bs.liabilities.map((r) => ({ ...r, section: "Liability" })),
    ...bs.equity.map((r) => ({ ...r, section: "Equity" })),
    {
      code: "",
      name: "Retained Earnings (P&L)",
      section: "Equity",
      closingBalance: bs.retainedEarnings,
    },
  ];
  await sendExport(
    res,
    req.query.format,
    "balance-sheet",
    "Balance Sheet",
    columns,
    rows,
    `As of ${bs.asOf}`,
  );
});

export const customerLedger = asyncHandler(async (req, res) => {
  res.json(await reportService.customerLedger(req.params.customerId));
});

export const branchWise = asyncHandler(async (req, res) => {
  res.json(
    await reportService.branchWiseSummary({
      from: req.query.from,
      to: req.query.to,
      branchId: req.query.branchId,
      branchSearch: req.query.branchSearch,
    }),
  );
});



// Typescript code  👇👇


// import { Request, Response } from 'express';
// import asyncHandler from "../middleware/asyncHandler.js";
// import * as reportService from "../services/reportService.js";
// import { toXlsxBuffer, toPdfBuffer } from "../services/exportService.js";

// const sendExport = async (
//   res: Response,
//   format: string | undefined,
//   filenameBase: string,
//   title: string,
//   columns: any[],
//   rows: any[],
//   subtitle?: string
// ): Promise<Response> => {
//   if (format === "pdf") {
//     const buffer = await toPdfBuffer(title, columns, rows, { subtitle });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${filenameBase}.pdf"`
//     );
//     return res.send(buffer);
//   }
//   const buffer = await toXlsxBuffer(title, columns, rows);
//   res.setHeader(
//     "Content-Type",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   );
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename="${filenameBase}.xlsx"`
//   );
//   return res.send(buffer);
// };

// export const trialBalance = asyncHandler(
//   async (req: Request, res: Response) => {
//     const result = await reportService.trialBalance({ 
//       asOf: req.query.asOf as string 
//     });
//     res.json(result);
//   }
// );

// export const trialBalanceExport = asyncHandler(
//   async (req: Request, res: Response) => {
//     const tb: any = await reportService.trialBalance({ 
//       asOf: req.query.asOf as string 
//     });
    
//     const columns = [
//       { key: "code", header: "Code" },
//       { key: "name", header: "Account" },
//       { key: "type", header: "Type" },
//       { key: "totalDebit", header: "Total Debit", numeric: true },
//       { key: "totalCredit", header: "Total Credit", numeric: true },
//       { key: "closingBalance", header: "Closing Balance", numeric: true },
//     ];
    
//     await sendExport(
//       res,
//       req.query.format as string,
//       "trial-balance",
//       "Trial Balance",
//       columns,
//       tb.rows,
//       `As of ${tb.asOf}`
//     );
//   }
// );

// export const accountLedger = asyncHandler(
//   async (req: Request<{ accountId: string }>, res: Response) => {
//     const result = await reportService.accountLedger(req.params.accountId, {
//       from: req.query.from as string,
//       to: req.query.to as string,
//     });
//     res.json(result);
//   }
// );

// export const accountLedgerExport = asyncHandler(
//   async (req: Request<{ accountId: string }>, res: Response) => {
//     const ledger: any = await reportService.accountLedger(
//       req.params.accountId,
//       {
//         from: req.query.from as string,
//         to: req.query.to as string,
//       }
//     );
    
//     const columns = [
//       { key: "date", header: "Date" },
//       { key: "voucherNo", header: "Voucher" },
//       { key: "narration", header: "Narration" },
//       { key: "debit", header: "Debit", numeric: true },
//       { key: "credit", header: "Credit", numeric: true },
//       { key: "runningBalance", header: "Running Balance", numeric: true },
//     ];
    
//     const rows = ledger.rows.map((r: any) => ({
//       ...r,
//       date: new Date(r.date).toLocaleDateString("en-IN"),
//     }));
    
//     await sendExport(
//       res,
//       req.query.format as string,
//       "account-ledger",
//       `Ledger — ${ledger.account.code} ${ledger.account.name}`,
//       columns,
//       rows
//     );
//   }
// );

// export const profitAndLoss = asyncHandler(
//   async (req: Request, res: Response) => {
//     const result = await reportService.profitAndLoss({
//       from: req.query.from as string,
//       to: req.query.to as string,
//     });
//     res.json(result);
//   }
// );

// export const profitAndLossExport = asyncHandler(
//   async (req: Request, res: Response) => {
//     const pnl: any = await reportService.profitAndLoss({
//       from: req.query.from as string,
//       to: req.query.to as string,
//     });
    
//     const columns = [
//       { key: "code", header: "Code" },
//       { key: "name", header: "Account" },
//       { key: "section", header: "Section" },
//       { key: "amount", header: "Amount", numeric: true },
//     ];
    
//     const rows = [
//       ...pnl.income.map((r: any) => ({ ...r, section: "Income" })),
//       ...pnl.expense.map((r: any) => ({ ...r, section: "Expense" })),
//       {
//         code: "",
//         name: "Net Profit",
//         section: "",
//         amount: pnl.netProfit,
//       },
//     ];
    
//     await sendExport(
//       res,
//       req.query.format as string,
//       "profit-and-loss",
//       "Profit & Loss Statement",
//       columns,
//       rows,
//       `${pnl.from ?? "inception"} to ${pnl.to ?? "date"}`
//     );
//   }
// );

// export const balanceSheet = asyncHandler(
//   async (req: Request, res: Response) => {
//     const result = await reportService.balanceSheet({ 
//       asOf: req.query.asOf as string 
//     });
//     res.json(result);
//   }
// );

// export const balanceSheetExport = asyncHandler(
//   async (req: Request, res: Response) => {
//     const bs: any = await reportService.balanceSheet({ 
//       asOf: req.query.asOf as string 
//     });
    
//     const columns = [
//       { key: "code", header: "Code" },
//       { key: "name", header: "Account" },
//       { key: "section", header: "Section" },
//       { key: "closingBalance", header: "Balance", numeric: true },
//     ];
    
//     const rows = [
//       ...bs.assets.map((r: any) => ({ ...r, section: "Asset" })),
//       ...bs.liabilities.map((r: any) => ({ ...r, section: "Liability" })),
//       ...bs.equity.map((r: any) => ({ ...r, section: "Equity" })),
//       {
//         code: "",
//         name: "Retained Earnings (P&L)",
//         section: "Equity",
//         closingBalance: bs.retainedEarnings,
//       },
//     ];
    
//     await sendExport(
//       res,
//       req.query.format as string,
//       "balance-sheet",
//       "Balance Sheet",
//       columns,
//       rows,
//       `As of ${bs.asOf}`
//     );
//   }
// );

// export const customerLedger = asyncHandler(
//   async (req: Request<{ customerId: string }>, res: Response) => {
//     const result = await reportService.customerLedger(req.params.customerId);
//     res.json(result);
//   }
// );

// export const branchWise = asyncHandler(
//   async (req: Request, res: Response) => {
//     const result = await reportService.branchWiseSummary({
//       from: req.query.from as string,
//       to: req.query.to as string,
//       branchId: req.query.branchId as string,
//       branchSearch: req.query.branchSearch as string,
//     });
//     res.json(result);
//   }
// );