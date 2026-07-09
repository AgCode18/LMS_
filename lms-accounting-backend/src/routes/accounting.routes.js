import { Router } from 'express';
import * as ctrl from '../controllers/accountingController.js';

const router = Router();

router.post('/loan-disbursement', ctrl.loanDisbursement);
router.post('/emi-collection', ctrl.emiCollection);
router.post('/penalty-collection', ctrl.penaltyCollection);
router.post('/processing-fee', ctrl.processingFee);
router.post('/refund', ctrl.refund);
router.post('/write-off', ctrl.writeOff);
router.post('/recovery-payment', ctrl.recoveryPayment);

export default router;
