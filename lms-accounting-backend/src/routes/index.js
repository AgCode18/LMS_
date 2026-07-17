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


// import { Router, IRouter, Request, Response } from 'express';
// import accountsRoutes from './accounts.routes.js';
// import branchRoutes from './branch.routes.js';
// import journalRoutes from './journal.routes.js';
// import accountingRoutes from './accounting.routes.js';
// import reportsRoutes from './reports.routes.js';
// import loansRoutes from './loans.routes.js';

// const router: IRouter = Router();

// // Core master data routes
// router.use('/accounts', accountsRoutes);
// router.use('/branches', branchRoutes);

// // Transaction routes
// router.use('/journal-entries', journalRoutes);
// router.use('/accounting', accountingRoutes);

// // Reporting routes
// router.use('/reports', reportsRoutes);

// // Loan lifecycle routes
// router.use('/loans', loansRoutes);

// // Health check endpoint
// router.get('/health', (_req: Request, res: Response) => {
//   res.json({ 
//     status: 'ok',
//     timestamp: new Date().toISOString()
//   });
// });

// export default router;