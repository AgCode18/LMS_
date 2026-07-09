import asyncHandler from '../middleware/asyncHandler.js';
import * as accountService from '../services/accountService.js';

export const list = asyncHandler(async (req, res) => {
  const { type, status, search, page, pageSize } = req.query;
  res.json(
    await accountService.listAccounts({
      type,
      status,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
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
