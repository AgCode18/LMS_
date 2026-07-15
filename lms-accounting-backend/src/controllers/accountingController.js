import asyncHandler from '../middleware/asyncHandler.js';
import * as autoPosting from '../services/autoPostingService.js';

// These endpoints exist so your existing loan-application / EMI /
// recovery controllers can call the accounting engine over HTTP without
// importing its internals directly. If your real backend is a single
// Node project, prefer calling the autoPostingService functions in
// process (see README) — it's the same logic, just skips the HTTP hop.

export const loanDisbursement = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postLoanDisbursement(req.body));
});

export const emiCollection = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postEmiCollection(req.body));
});

export const penaltyCollection = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postPenaltyCollection(req.body));
});

export const processingFee = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postProcessingFee(req.body));
});

export const refund = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postRefund(req.body));
});

export const writeOff = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postWriteOff(req.body));
});

export const recoveryPayment = asyncHandler(async (req, res) => {
  res.status(201).json(await autoPosting.postRecoveryPayment(req.body));
});



// TS code

// import { Request, Response } from 'express';
// import asyncHandler from '../middleware/asyncHandler.js';
// import * as autoPosting from '../services/autoPostingService.js';

// // These endpoints exist so your existing loan-application / EMI /
// // recovery controllers can call the accounting engine over HTTP without
// // importing its internals directly. If your real backend is a single
// // Node project, prefer calling the autoPostingService functions in
// // process (see README) — it's the same logic, just skips the HTTP hop.

// export const loanDisbursement = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postLoanDisbursement(req.body);
//     res.status(201).json(result);
//   }
// );

// export const emiCollection = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postEmiCollection(req.body);
//     res.status(201).json(result);
//   }
// );

// export const penaltyCollection = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postPenaltyCollection(req.body);
//     res.status(201).json(result);
//   }
// );

// export const processingFee = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postProcessingFee(req.body);
//     res.status(201).json(result);
//   }
// );

// export const refund = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postRefund(req.body);
//     res.status(201).json(result);
//   }
// );

// export const writeOff = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postWriteOff(req.body);
//     res.status(201).json(result);
//   }
// );

// export const recoveryPayment = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const result = await autoPosting.postRecoveryPayment(req.body);
//     res.status(201).json(result);
//   }
// );