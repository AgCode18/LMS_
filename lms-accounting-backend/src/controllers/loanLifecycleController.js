import asyncHandler from '../middleware/asyncHandler.js';
import * as lifecycle from '../services/loanLifecycleService.js';

export const checkEligibility = asyncHandler(async (req, res) => {
  const { eligible, reasons } = await lifecycle.checkDisbursementEligibility(req.params.id);
  res.json({ eligible, reasons });
});

export const disburse = asyncHandler(async (req, res) => {
  const result = await lifecycle.disburseLoan({ loanApplicationId: req.params.id, ...req.body });
  res.status(201).json(result);
});

export const collectEmi = asyncHandler(async (req, res) => {
  const result = await lifecycle.collectEmi({ emiScheduleId: req.params.emiScheduleId, ...req.body });
  res.status(201).json(result);
});

export const collectPenalty = asyncHandler(async (req, res) => {
  const result = await lifecycle.collectPenalty({ loanApplicationId: req.params.id, ...req.body });
  res.status(201).json(result);
});

export const chargeProcessingFee = asyncHandler(async (req, res) => {
  const result = await lifecycle.chargeProcessingFee({ loanApplicationId: req.params.id, ...req.body });
  res.status(201).json(result);
});

export const refund = asyncHandler(async (req, res) => {
  const result = await lifecycle.issueRefund(req.body);
  res.status(201).json(result);
});

export const writeOff = asyncHandler(async (req, res) => {
  const result = await lifecycle.writeOffLoan({ loanApplicationId: req.params.id, ...req.body });
  res.status(201).json(result);
});

export const recoveryPayment = asyncHandler(async (req, res) => {
  const result = await lifecycle.recordRecoveryPayment({ loanRecoveryId: req.params.loanRecoveryId, ...req.body });
  res.status(201).json(result);
});
