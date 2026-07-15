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


// typescript code 👇👇


// import { Router } from 'express';
// import * as ctrl from '../controllers/reportController.js';
// import { reconciliationController } from '../controllers/reconciliationController.js';

// // ============================================================================
// // Route Definitions
// // ============================================================================

// const router: Router = Router();

// /**
//  * Report Routes
//  * 
//  * These endpoints provide various financial and accounting reports including:
//  * - Trial Balance
//  * - Profit & Loss Statement
//  * - Balance Sheet
//  * - Account Ledger
//  * - Customer Ledger
//  * - Branch-wise Summary
//  * - Bank Reconciliation
//  */

// // ============================================================================
// // Trial Balance Routes
// // ============================================================================

// /**
//  * GET /reports/trial-balance
//  * Get trial balance as of a specific date
//  * Query: { asOf?: string (date) }
//  * Returns: Trial balance with debit/credit totals
//  */
// router.get('/trial-balance', ctrl.trialBalance);

// /**
//  * GET /reports/trial-balance/export
//  * Export trial balance to Excel or PDF
//  * Query: { asOf?: string (date), format?: 'xlsx' | 'pdf' }
//  * Returns: File download
//  */
// router.get('/trial-balance/export', ctrl.trialBalanceExport);

// // ============================================================================
// // Profit & Loss Routes
// // ============================================================================

// /**
//  * GET /reports/profit-loss
//  * Get Profit & Loss statement for a period
//  * Query: { from?: string (date), to?: string (date) }
//  * Returns: Profit & Loss statement with income, expenses, and net profit
//  */
// router.get('/profit-loss', ctrl.profitAndLoss);

// /**
//  * GET /reports/profit-loss/export
//  * Export Profit & Loss statement to Excel or PDF
//  * Query: { from?: string (date), to?: string (date), format?: 'xlsx' | 'pdf' }
//  * Returns: File download
//  */
// router.get('/profit-loss/export', ctrl.profitAndLossExport);

// // ============================================================================
// // Balance Sheet Routes
// // ============================================================================

// /**
//  * GET /reports/balance-sheet
//  * Get Balance Sheet as of a specific date
//  * Query: { asOf?: string (date) }
//  * Returns: Balance sheet with assets, liabilities, and equity
//  */
// router.get('/balance-sheet', ctrl.balanceSheet);

// /**
//  * GET /reports/balance-sheet/export
//  * Export Balance Sheet to Excel or PDF
//  * Query: { asOf?: string (date), format?: 'xlsx' | 'pdf' }
//  * Returns: File download
//  */
// router.get('/balance-sheet/export', ctrl.balanceSheetExport);

// // ============================================================================
// // Account Ledger Routes
// // ============================================================================

// /**
//  * GET /reports/ledger/:accountId
//  * Get account ledger for a specific account
//  * Path: { accountId: string }
//  * Query: { from?: string (date), to?: string (date) }
//  * Returns: Account ledger with running balance
//  */
// router.get('/ledger/:accountId', ctrl.accountLedger);

// /**
//  * GET /reports/ledger/:accountId/export
//  * Export account ledger to Excel or PDF
//  * Path: { accountId: string }
//  * Query: { from?: string (date), to?: string (date), format?: 'xlsx' | 'pdf' }
//  * Returns: File download
//  */
// router.get('/ledger/:accountId/export', ctrl.accountLedgerExport);

// // ============================================================================
// // Customer Ledger Route
// // ============================================================================

// /**
//  * GET /reports/customer-ledger/:customerId
//  * Get customer ledger showing all transactions for a customer
//  * Path: { customerId: string }
//  * Returns: Customer ledger with all loan transactions
//  */
// router.get('/customer-ledger/:customerId', ctrl.customerLedger);

// // ============================================================================
// // Branch-wise Summary Route
// // ============================================================================

// /**
//  * GET /reports/branch-wise
//  * Get branch-wise summary of disbursements and applications
//  * Query: { from?: string (date), to?: string (date), branchId?: string, branchSearch?: string }
//  * Returns: Branch-wise summary data
//  */
// router.get('/branch-wise', ctrl.branchWise);

// // ============================================================================
// // Bank Reconciliation Routes
// // ============================================================================

// /**
//  * GET /reports/reconciliation
//  * Get bank reconciliation data
//  * Query: { accountId: string, statementDate: string, bankBalance: number }
//  * Returns: Reconciliation data with deposits in transit and outstanding checks
//  */
// router.get('/reconciliation', reconciliationController.getReconciliation);

// /**
//  * GET /reports/reconciliation/export
//  * Export bank reconciliation to Excel or PDF
//  * Query: { accountId: string, statementDate: string, bankBalance: number, format?: 'xlsx' | 'pdf' }
//  * Returns: File download
//  */
// router.get('/reconciliation/export', reconciliationController.exportReconciliation);

// /**
//  * PATCH /reports/reconciliation/lines/:lineId/clear
//  * Mark a journal line as cleared/uncleared by bank
//  * Path: { lineId: string }
//  * Body: { isCleared: boolean, clearedDate?: string }
//  * Returns: Updated journal line
//  */
// router.patch('/reconciliation/lines/:lineId/clear', reconciliationController.setLineCleared);

// /**
//  * POST /reports/reconciliation
//  * Create a reconciliation report
//  * Body: { accountId: string, statementDate: string, bankBalance: number, reconcilingItems?: Array<{ lineId: string, cleared: boolean }> }
//  * Returns: Created reconciliation report
//  */
// router.post('/reconciliation', reconciliationController.createReconciliationReport);

// export default router;

// // ============================================================================
// // Optional: Route Configuration with Constants
// // ============================================================================

// /**
//  * Report route paths as constants for maintainability
//  */
// export const REPORT_ROUTES = {
//   TRIAL_BALANCE: '/trial-balance',
//   TRIAL_BALANCE_EXPORT: '/trial-balance/export',
//   PROFIT_LOSS: '/profit-loss',
//   PROFIT_LOSS_EXPORT: '/profit-loss/export',
//   BALANCE_SHEET: '/balance-sheet',
//   BALANCE_SHEET_EXPORT: '/balance-sheet/export',
//   LEDGER: '/ledger/:accountId',
//   LEDGER_EXPORT: '/ledger/:accountId/export',
//   CUSTOMER_LEDGER: '/customer-ledger/:customerId',
//   BRANCH_WISE: '/branch-wise',
//   RECONCILIATION: '/reconciliation',
//   RECONCILIATION_EXPORT: '/reconciliation/export',
//   RECONCILIATION_CLEAR: '/reconciliation/lines/:lineId/clear',
//   RECONCILIATION_CREATE: '/reconciliation',
// } as const;

// /**
//  * Report route configuration
//  */
// interface ReportRouteConfig {
//   path: string;
//   method: 'get' | 'post' | 'put' | 'patch' | 'delete';
//   handler: (...args: any[]) => any;
//   description: string;
//   example?: string;
// }

// const reportRouteConfigs: ReportRouteConfig[] = [
//   {
//     path: REPORT_ROUTES.TRIAL_BALANCE,
//     method: 'get',
//     handler: ctrl.trialBalance,
//     description: 'Get trial balance',
//     example: 'GET /trial-balance?asOf=2024-01-01',
//   },
//   {
//     path: REPORT_ROUTES.TRIAL_BALANCE_EXPORT,
//     method: 'get',
//     handler: ctrl.trialBalanceExport,
//     description: 'Export trial balance',
//     example: 'GET /trial-balance/export?format=pdf&asOf=2024-01-01',
//   },
//   {
//     path: REPORT_ROUTES.PROFIT_LOSS,
//     method: 'get',
//     handler: ctrl.profitAndLoss,
//     description: 'Get Profit & Loss statement',
//     example: 'GET /profit-loss?from=2024-01-01&to=2024-12-31',
//   },
//   {
//     path: REPORT_ROUTES.PROFIT_LOSS_EXPORT,
//     method: 'get',
//     handler: ctrl.profitAndLossExport,
//     description: 'Export Profit & Loss statement',
//     example: 'GET /profit-loss/export?format=pdf&from=2024-01-01&to=2024-12-31',
//   },
//   {
//     path: REPORT_ROUTES.BALANCE_SHEET,
//     method: 'get',
//     handler: ctrl.balanceSheet,
//     description: 'Get Balance Sheet',
//     example: 'GET /balance-sheet?asOf=2024-12-31',
//   },
//   {
//     path: REPORT_ROUTES.BALANCE_SHEET_EXPORT,
//     method: 'get',
//     handler: ctrl.balanceSheetExport,
//     description: 'Export Balance Sheet',
//     example: 'GET /balance-sheet/export?format=pdf&asOf=2024-12-31',
//   },
//   {
//     path: REPORT_ROUTES.LEDGER,
//     method: 'get',
//     handler: ctrl.accountLedger,
//     description: 'Get account ledger',
//     example: 'GET /ledger/acc_123?from=2024-01-01&to=2024-12-31',
//   },
//   {
//     path: REPORT_ROUTES.LEDGER_EXPORT,
//     method: 'get',
//     handler: ctrl.accountLedgerExport,
//     description: 'Export account ledger',
//     example: 'GET /ledger/acc_123/export?format=pdf',
//   },
//   {
//     path: REPORT_ROUTES.CUSTOMER_LEDGER,
//     method: 'get',
//     handler: ctrl.customerLedger,
//     description: 'Get customer ledger',
//     example: 'GET /customer-ledger/cust_123',
//   },
//   {
//     path: REPORT_ROUTES.BRANCH_WISE,
//     method: 'get',
//     handler: ctrl.branchWise,
//     description: 'Get branch-wise summary',
//     example: 'GET /branch-wise?branchId=br_123&from=2024-01-01',
//   },
//   {
//     path: REPORT_ROUTES.RECONCILIATION,
//     method: 'get',
//     handler: reconciliationController.getReconciliation,
//     description: 'Get bank reconciliation',
//     example: 'GET /reconciliation?accountId=acc_123&statementDate=2024-01-01&bankBalance=10000',
//   },
//   {
//     path: REPORT_ROUTES.RECONCILIATION_EXPORT,
//     method: 'get',
//     handler: reconciliationController.exportReconciliation,
//     description: 'Export bank reconciliation',
//     example: 'GET /reconciliation/export?accountId=acc_123&statementDate=2024-01-01&bankBalance=10000&format=pdf',
//   },
//   {
//     path: REPORT_ROUTES.RECONCILIATION_CLEAR,
//     method: 'patch',
//     handler: reconciliationController.setLineCleared,
//     description: 'Mark journal line as cleared',
//     example: 'PATCH /reconciliation/lines/line_123/clear with { isCleared: true }',
//   },
//   {
//     path: REPORT_ROUTES.RECONCILIATION_CREATE,
//     method: 'post',
//     handler: reconciliationController.createReconciliationReport,
//     description: 'Create reconciliation report',
//     example: 'POST /reconciliation with { accountId: "acc_123", statementDate: "2024-01-01", bankBalance: 10000 }',
//   },
// ];

// // ============================================================================
// // Alternative: Dynamic Router Creation
// // ============================================================================

// /**
//  * Creates a configured report router
//  * Useful for testing or dependency injection
//  */
// export const createReportRouter = (): Router => {
//   const routerInstance: Router = Router();
  
//   reportRouteConfigs.forEach(({ path, method, handler }) => {
//     routerInstance[method](path, handler);
//   });
  
//   return routerInstance;
// };

// // ============================================================================
// // Enhanced Router with Middleware Example
// // ============================================================================

// /**
//  * Example of router with middleware
//  * Uncomment and modify as needed
//  */
// /*
// import { authenticate } from '../middleware/auth.js';
// import { requirePermission } from '../middleware/permission.js';
// import { rateLimiter } from '../middleware/rateLimiter.js';

// const routerWithMiddleware = Router();

// // All report routes require authentication
// routerWithMiddleware.use(authenticate);

// // Report routes with rate limiting
// routerWithMiddleware.get(
//   '/trial-balance',
//   rateLimiter,
//   requirePermission('reports:read'),
//   ctrl.trialBalance
// );
// routerWithMiddleware.get(
//   '/trial-balance/export',
//   rateLimiter,
//   requirePermission('reports:export'),
//   ctrl.trialBalanceExport
// );
// // ... other routes with middleware

// export default routerWithMiddleware;
// */

// // ============================================================================
// // Type Exports
// // ============================================================================

// export type ReportRouter = typeof router;

// /**
//  * Get all report route paths for testing or documentation
//  */
// export const getReportRoutePaths = () =>
//   reportRouteConfigs.map(({ path, method, description }) => ({
//     path,
//     method,
//     description,
//   }));

// /**
//  * Report route prefixes for validation
//  */
// export const reportRoutePrefixes = [
//   '/trial-balance',
//   '/trial-balance/export',
//   '/profit-loss',
//   '/profit-loss/export',
//   '/balance-sheet',
//   '/balance-sheet/export',
//   '/ledger/:accountId',
//   '/ledger/:accountId/export',
//   '/customer-ledger/:customerId',
//   '/branch-wise',
//   '/reconciliation',
//   '/reconciliation/export',
//   '/reconciliation/lines/:lineId/clear',
// ] as const;

// // ============================================================================
// // Named Router Export
// // ============================================================================

// export const reportRouter = router;