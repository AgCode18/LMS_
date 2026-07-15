import asyncHandler from "../middleware/asyncHandler.js";
import * as accountService from "../services/accountService.js";

export const list = asyncHandler(async (req, res) => {
  const { type, status, search, page, pageSize } = req.query;
  res.json(
    await accountService.listAccounts({
      type,
      status,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    }),
  );
});

export const nextCode = asyncHandler(async (req, res) => {
  res.json({ code: await accountService.generateNextCode(req.query.type) });
});

export const tree = asyncHandler(async (_req, res) => {
  res.json(await accountService.getAccountTree());
});

export const get = asyncHandler(async (req, res) => {
  res.json(await accountService.getAccountById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await accountService.createAccount(req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await accountService.updateAccount(req.params.id, req.body));
});

// TS code

// import { Request, Response } from 'express';
// import asyncHandler from '../middleware/asyncHandler.js';
// import * as accountService from '../services/accountService.js';
// import { AccountQueryParams, AccountCreateInput, AccountUpdateInput } from '../types/accountTypes.js';

// interface ListQueryParams {
//   type?: string;
//   status?: string;
//   search?: string;
//   page?: string;
//   pageSize?: string;
// }

// export const list = asyncHandler(async (req: Request<{}, {}, {}, ListQueryParams>, res: Response) => {
//   const { type, status, search, page, pageSize } = req.query;

//   const queryParams: AccountQueryParams = {
//     type,
//     status,
//     search,
//     page: page ? Number(page) : undefined,
//     pageSize: pageSize ? Number(pageSize) : undefined,
//   };

//   const result = await accountService.listAccounts(queryParams);
//   res.json(result);
// });

// export const nextCode = asyncHandler(async (req: Request<{}, {}, {}, { type?: string }>, res: Response) => {
//   const code = await accountService.generateNextCode(req.query.type);
//   res.json({ code });
// });

// export const tree = asyncHandler(async (_req: Request, res: Response) => {
//   const treeData = await accountService.getAccountTree();
//   res.json(treeData);
// });

// export const get = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
//   const account = await accountService.getAccountById(req.params.id);
//   res.json(account);
// });

// export const create = asyncHandler(async (req: Request<{}, {}, AccountCreateInput>, res: Response) => {
//   const newAccount = await accountService.createAccount(req.body);
//   res.status(201).json(newAccount);
// });

// export const update = asyncHandler(async (req: Request<{ id: string }, {}, AccountUpdateInput>, res: Response) => {
//   const updatedAccount = await accountService.updateAccount(req.params.id, req.body);
//   res.json(updatedAccount);
// });
