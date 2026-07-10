import { Router } from 'express';
import * as ctrl from '../controllers/reportController.js';
import { reconciliationController } from '../controllers/reconciliationController.js';

const router = Router();

router.get('/trial-balance', ctrl.trialBalance);
router.get('/trial-balance/export', ctrl.trialBalanceExport);
router.get('/profit-loss', ctrl.profitAndLoss);
router.get('/profit-loss/export', ctrl.profitAndLossExport);
router.get('/balance-sheet', ctrl.balanceSheet);
router.get('/balance-sheet/export', ctrl.balanceSheetExport);
router.get('/ledger/:accountId', ctrl.accountLedger);
router.get('/ledger/:accountId/export', ctrl.accountLedgerExport);
router.get('/customer-ledger/:customerId', ctrl.customerLedger);
router.get('/branch-wise', ctrl.branchWise);
router.get('/reconciliation', reconciliationController.getReconciliation);
router.get('/reconciliation/export', reconciliationController.exportReconciliation);
router.patch('/reconciliation/lines/:lineId/clear', reconciliationController.setLineCleared);
router.post('/reconciliation', reconciliationController.createReconciliationReport);

export default router;
