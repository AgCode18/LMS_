import { Router } from 'express';
import * as ctrl from '../controllers/branchController.js';

const router = Router();

router.get('/', ctrl.listBranches);
router.post('/', ctrl.createBranch);

export default router;


// typescript code 👇👇



// import { Router, IRouter } from 'express';
// import * as ctrl from '../controllers/branchController.js';
// import asyncHandler from '../middleware/asyncHandler.js';
// import { authenticate } from '../middleware/auth.js';
// import { authorize } from '../middleware/authorize.js';
// import { validateRequest } from '../middleware/validation.js';
// import { createBranchSchema, listBranchesSchema } from '../validators/branchValidators.js';

// const router: IRouter = Router();

// // List branches with filtering
// router.get(
//   '/',
//   authenticate,
//   authorize('view_branches'),
//   validateRequest(listBranchesSchema, 'query'),
//   asyncHandler(ctrl.listBranches)
// );

// // Create a new branch
// router.post(
//   '/',
//   authenticate,
//   authorize('create_branch'),
//   validateRequest(createBranchSchema),
//   asyncHandler(ctrl.createBranch)
// );

// export default router;