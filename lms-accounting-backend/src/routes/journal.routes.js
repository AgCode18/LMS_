import { Router } from 'express';
import * as ctrl from '../controllers/journalController.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/export', ctrl.exportList);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.post('/:id/post', ctrl.post);
router.post('/:id/cancel', ctrl.cancel);

export default router;


// typescript code
// import { Router } from 'express';
// import * as ctrl from '../controllers/journalController.js';

// const router: Router = Router();

// router.get('/', ctrl.list);
// router.get('/export', ctrl.exportList);
// router.get('/:id', ctrl.get);
// router.post('/', ctrl.create);
// router.post('/:id/post', ctrl.post);
// router.post('/:id/cancel', ctrl.cancel);

// export default router;