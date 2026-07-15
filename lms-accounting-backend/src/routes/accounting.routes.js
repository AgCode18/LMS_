import { Router } from "express";
import * as ctrl from "../controllers/accountingController.js";

const router = Router();

router.post("/loan-disbursement", ctrl.loanDisbursement);
router.post("/emi-collection", ctrl.emiCollection);
router.post("/penalty-collection", ctrl.penaltyCollection);
router.post("/processing-fee", ctrl.processingFee);
router.post("/refund", ctrl.refund);
router.post("/write-off", ctrl.writeOff);
router.post("/recovery-payment", ctrl.recoveryPayment);

export default router;

// typescript code 👇👇

// import { Router, IRouter } from 'express';
// import * as ctrl from '../controllers/accountingController.js';
// import { validateRequest } from '../middleware/validation.js';
// import {
//   loanDisbursementSchema,
//   emiCollectionSchema,
//   penaltyCollectionSchema,
//   processingFeeSchema,
//   refundSchema,
//   writeOffSchema,
//   recoveryPaymentSchema
// } from '../validators/accountingValidators.js';

// const router: IRouter = Router();

// // Accounting endpoints with validation middleware
// router.post(
//   '/loan-disbursement',
//   validateRequest(loanDisbursementSchema),
//   ctrl.loanDisbursement
// );

// router.post(
//   '/emi-collection',
//   validateRequest(emiCollectionSchema),
//   ctrl.emiCollection
// );

// router.post(
//   '/penalty-collection',
//   validateRequest(penaltyCollectionSchema),
//   ctrl.penaltyCollection
// );

// router.post(
//   '/processing-fee',
//   validateRequest(processingFeeSchema),
//   ctrl.processingFee
// );

// router.post(
//   '/refund',
//   validateRequest(refundSchema),
//   ctrl.refund
// );

// router.post(
//   '/write-off',
//   validateRequest(writeOffSchema),
//   ctrl.writeOff
// );

// router.post(
//   '/recovery-payment',
//   validateRequest(recoveryPaymentSchema),
//   ctrl.recoveryPayment
// );

// export default router;
