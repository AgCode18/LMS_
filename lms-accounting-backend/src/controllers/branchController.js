import asyncHandler from '../middleware/asyncHandler.js';
import * as branchService from '../services/branchService.js';

export const listBranches = asyncHandler(async (req, res) => {
  const { search, onlyActive } = req.query;
  res.json(await branchService.listBranches({ search, onlyActive: onlyActive === 'true' }));
});

export const createBranch = asyncHandler(async (req, res) => {
  res.status(201).json(await branchService.createBranch(req.body));
});



// Typescript code  👇👇




// import { Request, Response } from 'express';
// import asyncHandler from '../middleware/asyncHandler.js';
// import * as branchService from '../services/branchService.js';

// export const listBranches = asyncHandler(
//   async (req: Request<{}, {}, {}, { search?: string; onlyActive?: string }>, res: Response) => {
//     const { search, onlyActive } = req.query;
//     res.json(
//       await branchService.listBranches({ 
//         search, 
//         onlyActive: onlyActive === 'true' 
//       })
//     );
//   }
// );

// export const createBranch = asyncHandler(
//   async (req: Request<{}, {}, any>, res: Response) => {
//     const newBranch = await branchService.createBranch(req.body);
//     res.status(201).json(newBranch);
//   }
// );