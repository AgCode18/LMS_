import { Router } from 'express';
import * as ctrl from '../controllers/loanLifecycleController.js';

const router = Router();

router.get('/:id/disbursement-eligibility', ctrl.checkEligibility);
router.post('/:id/disburse', ctrl.disburse);
router.post('/emi/:emiScheduleId/collect', ctrl.collectEmi);
router.post('/:id/penalty', ctrl.collectPenalty);
router.post('/:id/processing-fee', ctrl.chargeProcessingFee);
router.post('/refund', ctrl.refund);
router.post('/:id/write-off', ctrl.writeOff);
router.post('/recovery/:loanRecoveryId/payment', ctrl.recoveryPayment);

export default router;


// typescript code 👇👇


// import { Router } from 'express';
// import * as ctrl from '../controllers/loanLifecycleController.js';

// // ============================================================================
// // Route Definitions
// // ============================================================================

// const router: Router = Router();

// /**
//  * Loan Lifecycle Routes
//  * 
//  * These endpoints manage the complete loan lifecycle including:
//  * - Disbursement eligibility checking
//  * - Loan disbursement
//  * - EMI collection
//  * - Penalty collection
//  * - Processing fee charging
//  * - Refund issuance
//  * - Loan write-off
//  * - Recovery payment recording
//  */

// /**
//  * GET /loans/:id/disbursement-eligibility
//  * Checks if a loan is eligible for disbursement
//  * Path param: id (loan application ID)
//  * Returns: Eligibility status with reasons
//  * 
//  * Eligibility checks:
//  * - KYC: Must be VERIFIED
//  * - Sanction: Must be APPROVED
//  * - NACH: Must be ACTIVE
//  * - Already disbursed: Must not be disbursed
//  */
// router.get('/:id/disbursement-eligibility', ctrl.checkEligibility);

// /**
//  * POST /loans/:id/disburse
//  * Disburses a loan after eligibility check
//  * Path param: id (loan application ID)
//  * Body: {
//  *   disbursementMode: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI',
//  *   bankName?: string,
//  *   bankAccountNumber?: string,
//  *   ifscCode?: string,
//  *   accountHolderName?: string,
//  *   transactionReference?: string,
//  *   processedBy?: string
//  * }
//  * Returns: Disbursement record with journal entry
//  */
// router.post('/:id/disburse', ctrl.disburse);

// /**
//  * POST /loans/emi/:emiScheduleId/collect
//  * Collects EMI payment
//  * Path param: emiScheduleId (EMI schedule ID)
//  * Body: {
//  *   principalAmount?: number,
//  *   interestAmount?: number,
//  *   penaltyAmount?: number,
//  *   bounceAmount?: number,
//  *   paymentMode: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD',
//  *   transactionReference?: string,
//  *   processedById?: string,
//  *   branchId?: string
//  * }
//  * Returns: EMI payment with journal entry
//  */
// router.post('/emi/:emiScheduleId/collect', ctrl.collectEmi);

// /**
//  * POST /loans/:id/penalty
//  * Collects penalty outside regular EMI
//  * Path param: id (loan application ID)
//  * Body: { amount: number }
//  * Returns: Journal entry for penalty collection
//  */
// router.post('/:id/penalty', ctrl.collectPenalty);

// /**
//  * POST /loans/:id/processing-fee
//  * Charges processing fee
//  * Path param: id (loan application ID)
//  * Body: {
//  *   amount: number,
//  *   collectedImmediately?: boolean (default: true)
//  * }
//  * Returns: Journal entry for processing fee
//  */
// router.post('/:id/processing-fee', ctrl.chargeProcessingFee);

// /**
//  * POST /loans/refund
//  * Issues a refund
//  * Body: {
//  *   referenceId: string,
//  *   amount: number,
//  *   reason?: string
//  * }
//  * Returns: Journal entry for refund
//  */
// router.post('/refund', ctrl.refund);

// /**
//  * POST /loans/:id/write-off
//  * Writes off a loan
//  * Path param: id (loan application ID)
//  * Body: { amount: number }
//  * Returns: Journal entry for write-off
//  */
// router.post('/:id/write-off', ctrl.writeOff);

// /**
//  * POST /loans/recovery/:loanRecoveryId/payment
//  * Records a recovery payment
//  * Path param: loanRecoveryId (loan recovery ID)
//  * Body: {
//  *   amount: number,
//  *   paymentMode: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD',
//  *   referenceNo?: string
//  * }
//  * Returns: Recovery payment with journal entry
//  */
// router.post('/recovery/:loanRecoveryId/payment', ctrl.recoveryPayment);

// export default router;

// // ============================================================================
// // Optional: Route Configuration with Constants
// // ============================================================================

// /**
//  * Loan route paths as constants for maintainability
//  */
// export const LOAN_ROUTES = {
//   ELIGIBILITY: '/:id/disbursement-eligibility',
//   DISBURSE: '/:id/disburse',
//   COLLECT_EMI: '/emi/:emiScheduleId/collect',
//   PENALTY: '/:id/penalty',
//   PROCESSING_FEE: '/:id/processing-fee',
//   REFUND: '/refund',
//   WRITE_OFF: '/:id/write-off',
//   RECOVERY_PAYMENT: '/recovery/:loanRecoveryId/payment',
// } as const;

// /**
//  * Loan route configuration
//  */
// interface LoanRouteConfig {
//   path: string;
//   method: 'get' | 'post' | 'put' | 'patch' | 'delete';
//   handler: (...args: any[]) => any;
//   description: string;
//   example?: string;
// }

// const loanRouteConfigs: LoanRouteConfig[] = [
//   {
//     path: LOAN_ROUTES.ELIGIBILITY,
//     method: 'get',
//     handler: ctrl.checkEligibility,
//     description: 'Check disbursement eligibility',
//     example: 'GET /123/disbursement-eligibility',
//   },
//   {
//     path: LOAN_ROUTES.DISBURSE,
//     method: 'post',
//     handler: ctrl.disburse,
//     description: 'Disburse loan',
//     example: 'POST /123/disburse',
//   },
//   {
//     path: LOAN_ROUTES.COLLECT_EMI,
//     method: 'post',
//     handler: ctrl.collectEmi,
//     description: 'Collect EMI payment',
//     example: 'POST /emi/456/collect',
//   },
//   {
//     path: LOAN_ROUTES.PENALTY,
//     method: 'post',
//     handler: ctrl.collectPenalty,
//     description: 'Collect penalty',
//     example: 'POST /123/penalty',
//   },
//   {
//     path: LOAN_ROUTES.PROCESSING_FEE,
//     method: 'post',
//     handler: ctrl.chargeProcessingFee,
//     description: 'Charge processing fee',
//     example: 'POST /123/processing-fee',
//   },
//   {
//     path: LOAN_ROUTES.REFUND,
//     method: 'post',
//     handler: ctrl.refund,
//     description: 'Issue refund',
//     example: 'POST /refund',
//   },
//   {
//     path: LOAN_ROUTES.WRITE_OFF,
//     method: 'post',
//     handler: ctrl.writeOff,
//     description: 'Write off loan',
//     example: 'POST /123/write-off',
//   },
//   {
//     path: LOAN_ROUTES.RECOVERY_PAYMENT,
//     method: 'post',
//     handler: ctrl.recoveryPayment,
//     description: 'Record recovery payment',
//     example: 'POST /recovery/789/payment',
//   },
// ];

// // ============================================================================
// // Alternative: Dynamic Router Creation
// // ============================================================================

// /**
//  * Creates a configured loan router
//  * Useful for testing or dependency injection
//  */
// export const createLoanRouter = (): Router => {
//   const routerInstance: Router = Router();
  
//   loanRouteConfigs.forEach(({ path, method, handler }) => {
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
// import { validateRequest } from '../middleware/validateRequest.js';
// import { loanSchemas } from '../schemas/loanSchemas.js';
// import { requirePermission } from '../middleware/permission.js';

// const routerWithMiddleware = Router();

// // Protected routes with authentication and permissions
// routerWithMiddleware.get(
//   '/:id/disbursement-eligibility',
//   authenticate,
//   requirePermission('loan:read'),
//   ctrl.checkEligibility
// );

// routerWithMiddleware.post(
//   '/:id/disburse',
//   authenticate,
//   requirePermission('loan:disburse'),
//   validateRequest(loanSchemas.disburse),
//   ctrl.disburse
// );

// routerWithMiddleware.post(
//   '/emi/:emiScheduleId/collect',
//   authenticate,
//   requirePermission('loan:collect'),
//   validateRequest(loanSchemas.collectEmi),
//   ctrl.collectEmi
// );

// routerWithMiddleware.post(
//   '/:id/penalty',
//   authenticate,
//   requirePermission('loan:penalty'),
//   validateRequest(loanSchemas.penalty),
//   ctrl.collectPenalty
// );

// routerWithMiddleware.post(
//   '/:id/processing-fee',
//   authenticate,
//   requirePermission('loan:processing-fee'),
//   validateRequest(loanSchemas.processingFee),
//   ctrl.chargeProcessingFee
// );

// routerWithMiddleware.post(
//   '/refund',
//   authenticate,
//   requirePermission('loan:refund'),
//   validateRequest(loanSchemas.refund),
//   ctrl.refund
// );

// routerWithMiddleware.post(
//   '/:id/write-off',
//   authenticate,
//   requirePermission('loan:write-off'),
//   validateRequest(loanSchemas.writeOff),
//   ctrl.writeOff
// );

// routerWithMiddleware.post(
//   '/recovery/:loanRecoveryId/payment',
//   authenticate,
//   requirePermission('loan:recovery'),
//   validateRequest(loanSchemas.recovery),
//   ctrl.recoveryPayment
// );

// export default routerWithMiddleware;
// */

// // ============================================================================
// // Type Exports
// // ============================================================================

// export type LoanRouter = typeof router;

// /**
//  * Get all loan route paths for testing or documentation
//  */
// export const getLoanRoutePaths = () =>
//   loanRouteConfigs.map(({ path, method, description }) => ({
//     path,
//     method,
//     description,
//   }));

// /**
//  * Loan route prefixes for validation
//  */
// export const loanRoutePrefixes = [
//   '/:id/disbursement-eligibility',
//   '/:id/disburse',
//   '/emi/:emiScheduleId/collect',
//   '/:id/penalty',
//   '/:id/processing-fee',
//   '/refund',
//   '/:id/write-off',
//   '/recovery/:loanRecoveryId/payment',
// ] as const;

// // ============================================================================
// // Named Router Export
// // ============================================================================

// export const loanRouter = router;