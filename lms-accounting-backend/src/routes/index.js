import { Router } from 'express';
import accountsRoutes from './accounts.routes.js';
import branchRoutes from './branch.routes.js';
import journalRoutes from './journal.routes.js';
import accountingRoutes from './accounting.routes.js';
import reportsRoutes from './reports.routes.js';
import loansRoutes from './loans.routes.js';

const router = Router();

router.use('/accounts', accountsRoutes);
router.use('/branches', branchRoutes);
router.use('/journal-entries', journalRoutes);
router.use('/accounting', accountingRoutes);
router.use('/reports', reportsRoutes);
router.use('/loans', loansRoutes);

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default router;



// typescript code 👇👇


