import prisma from '../lib/prisma.js';
import { bankReconciliation } from '../services/reportService.js';
import { toPdfBuffer, toXlsxBuffer } from '../services/exportService.js';

const sendExport = async (res, format, filenameBase, title, columns, rows, subtitle) => {
  if (format === 'pdf') {
    const buffer = await toPdfBuffer(title, columns, rows, { subtitle });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
    return res.send(buffer);
  }

  const buffer = await toXlsxBuffer(title, columns, rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
  return res.send(buffer);
};

export const reconciliationController = {
  // Get reconciliation data
  async getReconciliation(req, res, next) {
    try {
      const {
        accountId,
        statementDate,
        bankBalance,
        fromDate,
        toDate,
      } = req.query;

      if (!accountId || !statementDate || bankBalance === undefined) {
        return res.status(400).json({
          success: false,
          message: 'accountId, statementDate, and bankBalance are required',
        });
      }

      const data = await bankReconciliation(accountId, {
        statementDate,
        from: fromDate,
        to: toDate,
      });

      const adjustedBankBalance = Number(bankBalance) + data.depositsInTransit - data.outstandingChecks;
      const isReconciled = Math.abs(adjustedBankBalance - data.bookBalance) < 0.001;
      const discrepancies = [];

      if (!isReconciled) {
        discrepancies.push({
          type: 'BALANCE_MISMATCH',
          bookBalance: data.bookBalance,
          bankBalance: Number(bankBalance),
          adjustedBankBalance,
          difference: data.bookBalance - adjustedBankBalance,
          depositsInTransit: data.depositsInTransit,
          outstandingChecks: data.outstandingChecks,
        });
      }

      res.json({
        success: true,
        data: {
          account: data.account,
          statementDate: data.statementDate,
          bookBalance: data.bookBalance,
          bankStatementBalance: Number(bankBalance),
          adjustedBankBalance,
          depositsInTransit: data.depositsInTransit,
          outstandingChecks: data.outstandingChecks,
          isReconciled,
          discrepancies,
          rows: data.rows,
          reconciliationSummary: {
            totalUnclearedDebits: data.depositsInTransit,
            totalUnclearedCredits: data.outstandingChecks,
            netAdjustment: data.netAdjustment,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async exportReconciliation(req, res, next) {
    try {
      const {
        accountId,
        statementDate,
        bankBalance,
        fromDate,
        toDate,
        format,
      } = req.query;

      if (!accountId || !statementDate || bankBalance === undefined) {
        return res.status(400).json({
          success: false,
          message: 'accountId, statementDate, and bankBalance are required',
        });
      }

      const data = await bankReconciliation(accountId, {
        statementDate,
        from: fromDate,
        to: toDate,
      });

      const rows = data.rows.map((row) => ({
        date: new Date(row.date).toLocaleDateString('en-IN'),
        voucherNo: row.voucherNo,
        narration: row.narration,
        debit: row.debit,
        credit: row.credit,
        runningBalance: row.runningBalance,
        depositInTransit: row.isDepositInTransit ? 'Yes' : 'No',
        outstandingCheck: row.isOutstandingCheck ? 'Yes' : 'No',
      }));

      const columns = [
        { key: 'date', header: 'Date' },
        { key: 'voucherNo', header: 'Voucher' },
        { key: 'narration', header: 'Narration' },
        { key: 'debit', header: 'Debit', numeric: true },
        { key: 'credit', header: 'Credit', numeric: true },
        { key: 'runningBalance', header: 'Balance', numeric: true },
        { key: 'depositInTransit', header: 'Deposit In Transit' },
        { key: 'outstandingCheck', header: 'Outstanding Check' },
      ];

      const title = `Bank Reconciliation — ${data.account.code} ${data.account.name}`;
      const subtitle = `Statement Date: ${new Date(data.statementDate).toLocaleDateString('en-IN')} | Bank Balance: ${Number(bankBalance)}`;

      await sendExport(res, format, 'bank-reconciliation', title, columns, rows, subtitle);
    } catch (error) {
      next(error);
    }
  },

  // Create reconciliation report
  async createReconciliationReport(req, res, next) {
    try {
      const {
        accountId,
        statementDate,
        bankBalance,
        reconcilingItems
      } = req.body;

      // Validate input
      if (!accountId || !statementDate || bankBalance === undefined) {
        return res.status(400).json({
          success: false,
          message: 'accountId, statementDate, and bankBalance are required'
        });
      }

      // Get account details
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Generate report
      const report = {
        reportId: `REC-${Date.now()}`,
        account: {
          id: account.id,
          code: account.code,
          name: account.name
        },
        statementDate: new Date(statementDate),
        bankStatementBalance: Number(bankBalance),
        bookBalance: account.currentBalance,
        reconcilingItems: reconcilingItems || [],
        reconciledAt: new Date(),
        status: 'RECONCILED'
      };

      res.status(201).json({
        success: true,
        data: report,
        message: 'Reconciliation report generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};