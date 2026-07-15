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

// // ============================================================================
// // Route Definitions
// // ============================================================================

// const router: Router = Router();

// /**
//  * Journal Entry Routes
//  * 
//  * These endpoints manage journal entries including:
//  * - Listing and filtering journal entries
//  * - Exporting journal entries to Excel/PDF
//  * - Creating manual journal entries
//  * - Posting draft entries
//  * - Canceling entries
//  */

// /**
//  * GET /journal-entries
//  * Lists journal entries with pagination and filtering
//  * Query params:
//  *   - referenceType: string
//  *   - status: DRAFT | POSTED | CANCELLED
//  *   - from: date
//  *   - to: date
//  *   - accountSearch: string
//  *   - page: number
//  *   - pageSize: number
//  * Returns: Paginated list of journal entries
//  */
// router.get('/', ctrl.list);

// /**
//  * GET /journal-entries/export
//  * Exports journal entries to Excel or PDF
//  * Query params:
//  *   - referenceType: string
//  *   - status: DRAFT | POSTED | CANCELLED
//  *   - from: date
//  *   - to: date
//  *   - accountSearch: string
//  *   - format: xlsx | pdf (default: xlsx)
//  * Returns: File download (Excel or PDF)
//  */
// router.get('/export', ctrl.exportList);

// /**
//  * GET /journal-entries/:id
//  * Retrieves a single journal entry by ID
//  * Path param: id (journal entry ID)
//  * Returns: Journal entry with line items
//  */
// router.get('/:id', ctrl.get);

// /**
//  * POST /journal-entries
//  * Creates a manual journal entry
//  * Body: {
//  *   narration?: string,
//  *   referenceType?: string,
//  *   referenceId?: string,
//  *   lines: Array<{ accountId: string, debit?: number, credit?: number, description?: string }>,
//  *   transactionDate?: string,
//  *   status?: DRAFT | POSTED,
//  *   createdById?: string
//  * }
//  * Returns: Created journal entry
//  */
// router.post('/', ctrl.create);

// /**
//  * POST /journal-entries/:id/post
//  * Posts a draft journal entry (moves from DRAFT to POSTED)
//  * Path param: id (journal entry ID)
//  * Returns: Updated journal entry
//  */
// router.post('/:id/post', ctrl.post);

// /**
//  * POST /journal-entries/:id/cancel
//  * Cancels a journal entry (moves to CANCELLED status)
//  * Path param: id (journal entry ID)
//  * Returns: Updated journal entry
//  */
// router.post('/:id/cancel', ctrl.cancel);

// export default router;

// // ============================================================================
// // Optional: Route Configuration with Constants
// // ============================================================================

// /**
//  * Journal route paths as constants for maintainability
//  */
// export const JOURNAL_ROUTES = {
//   LIST: '/',
//   EXPORT: '/export',
//   GET: '/:id',
//   CREATE: '/',
//   POST: '/:id/post',
//   CANCEL: '/:id/cancel',
// } as const;

// /**
//  * Journal route configuration for dynamic registration
//  */
// interface JournalRouteConfig {
//   path: string;
//   method: 'get' | 'post' | 'put' | 'patch' | 'delete';
//   handler: (...args: any[]) => any;
//   description: string;
// }

// const journalRouteConfigs: JournalRouteConfig[] = [
//   {
//     path: JOURNAL_ROUTES.LIST,
//     method: 'get',
//     handler: ctrl.list,
//     description: 'List journal entries with filters',
//   },
//   {
//     path: JOURNAL_ROUTES.EXPORT,
//     method: 'get',
//     handler: ctrl.exportList,
//     description: 'Export journal entries to Excel/PDF',
//   },
//   {
//     path: JOURNAL_ROUTES.GET,
//     method: 'get',
//     handler: ctrl.get,
//     description: 'Get journal entry by ID',
//   },
//   {
//     path: JOURNAL_ROUTES.CREATE,
//     method: 'post',
//     handler: ctrl.create,
//     description: 'Create manual journal entry',
//   },
//   {
//     path: JOURNAL_ROUTES.POST,
//     method: 'post',
//     handler: ctrl.post,
//     description: 'Post draft journal entry',
//   },
//   {
//     path: JOURNAL_ROUTES.CANCEL,
//     method: 'post',
//     handler: ctrl.cancel,
//     description: 'Cancel journal entry',
//   },
// ];

// // ============================================================================
// // Alternative: Dynamic Router Creation
// // ============================================================================

// /**
//  * Creates a configured journal router
//  * Useful for testing or dependency injection
//  */
// export const createJournalRouter = (): Router => {
//   const routerInstance: Router = Router();
  
//   journalRouteConfigs.forEach(({ path, method, handler }) => {
//     routerInstance[method](path, handler);
//   });
  
//   return routerInstance;
// };

// // ============================================================================
// // Enhanced Router with Middleware Example
// // ============================================================================

// /**
//  * Example of router with middleware
//  * Uncomment and modify as needed
//  */
// /*
// import { authenticate } from '../middleware/auth.js';
// import { validateRequest } from '../middleware/validateRequest.js';
// import { journalSchemas } from '../schemas/journalSchemas.js';
// import { requirePermission } from '../middleware/permission.js';

// const routerWithMiddleware = Router();

// // Protected routes with authentication and permissions
// routerWithMiddleware.get(
//   '/',
//   authenticate,
//   requirePermission('journal:read'),
//   ctrl.list
// );

// routerWithMiddleware.get(
//   '/export',
//   authenticate,
//   requirePermission('journal:export'),
//   ctrl.exportList
// );

// routerWithMiddleware.get(
//   '/:id',
//   authenticate,
//   requirePermission('journal:read'),
//   ctrl.get
// );

// routerWithMiddleware.post(
//   '/',
//   authenticate,
//   requirePermission('journal:create'),
//   validateRequest(journalSchemas.create),
//   ctrl.create
// );

// routerWithMiddleware.post(
//   '/:id/post',
//   authenticate,
//   requirePermission('journal:post'),
//   ctrl.post
// );

// routerWithMiddleware.post(
//   '/:id/cancel',
//   authenticate,
//   requirePermission('journal:cancel'),
//   ctrl.cancel
// );

// export default routerWithMiddleware;
// */

// // ============================================================================
// // Type Exports
// // ============================================================================

// export type JournalRouter = typeof router;

// /**
//  * Get all journal route paths for testing or documentation
//  */
// export const getJournalRoutePaths = () =>
//   journalRouteConfigs.map(({ path, method, description }) => ({
//     path,
//     method,
//     description,
//   }));

// /**
//  * Journal route prefixes for validation
//  */
// export const journalRoutePrefixes = [
//   '/',
//   '/export',
//   '/:id',
//   '/:id/post',
//   '/:id/cancel',
// ] as const;

// // ============================================================================
// // Named Router Export
// // ============================================================================

// export const journalRouter = router;