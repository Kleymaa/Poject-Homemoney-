import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as accountService from '../services/account.service';

export const createAccount = asyncHandler(async (req: Request, res: Response) => {
  const data = await accountService.createAccount((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const data = await accountService.getAccounts((req as any).user.id);
  res.json({ success: true, data });
});

export const getAccountById = asyncHandler(async (req: Request, res: Response) => {
  const data = await accountService.getAccountById(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const data = await accountService.updateAccount(
    (req as any).user.id,
    String(req.params.id),
    req.body
  );
  res.json({ success: true, data });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const data = await accountService.deleteAccount(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});