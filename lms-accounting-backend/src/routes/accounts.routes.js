import { Router } from "express";
import * as ctrl from "../controllers/accountController.js";

const router = Router();

router.get("/tree", ctrl.tree);
router.get("/next-code", ctrl.nextCode);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);
router.patch("/:id", ctrl.update);

export default router;

// typescript code


// import { Router, IRouter } from "express";
// import * as ctrl from "../controllers/accountController.js";
// import asyncHandler from "../middleware/asyncHandler.js";
// import { authenticate } from "../middleware/auth.js";
// import { authorize } from "../middleware/authorize.js";
// import { validateRequest } from "../middleware/validation.js";
// import {
//   createAccountSchema,
//   updateAccountSchema,
//   listAccountsSchema,
// } from "../validators/accountValidators.js";

// const router: IRouter = Router();

// // Public/utility endpoints (no authentication required)
// router.get("/tree", asyncHandler(ctrl.tree));
// router.get("/next-code", asyncHandler(ctrl.nextCode));

// // Protected CRUD endpoints
// router.get(
//   "/",
//   authenticate,
//   authorize('view_accounts'),
//   validateRequest(listAccountsSchema, 'query'),
//   asyncHandler(ctrl.list)
// );

// router.get(
//   "/:id",
//   authenticate,
//   authorize('view_account'),
//   asyncHandler(ctrl.get)
// );

// router.post(
//   "/",
//   authenticate,
//   authorize('create_account'),
//   validateRequest(createAccountSchema),
//   asyncHandler(ctrl.create)
// );

// router.patch(
//   "/:id",
//   authenticate,
//   authorize('update_account'),
//   validateRequest(updateAccountSchema),
//   asyncHandler(ctrl.update)
// );

// export default router;