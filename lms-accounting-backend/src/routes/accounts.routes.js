import { Router } from 'express';
import * as ctrl from '../controllers/accountController.js';

const router = Router();

router.get('/tree', ctrl.tree);
router.get('/next-code', ctrl.nextCode);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);

export default router;
