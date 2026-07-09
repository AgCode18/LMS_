import { Router } from 'express';
import * as ctrl from '../controllers/branchController.js';

const router = Router();

router.get('/', ctrl.listBranches);
router.post('/', ctrl.createBranch);

export default router;
