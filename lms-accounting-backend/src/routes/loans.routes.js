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
