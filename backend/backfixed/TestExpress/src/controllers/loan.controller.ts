import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as loanService from '../services/loan.service';

export const createLoan = asyncHandler(async (req: Request, res: Response) => {
  const data = await loanService.createLoan((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getLoans = asyncHandler(async (req: Request, res: Response) => {
  const data = await loanService.getLoans((req as any).user.id);
  res.json({ success: true, data });
});

export const getLoanById = asyncHandler(async (req: Request, res: Response) => {
  const data = await loanService.getLoanById(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const updateLoan = asyncHandler(async (req: Request, res: Response) => {
  const data = await loanService.updateLoan(
    (req as any).user.id,
    String(req.params.id),
    req.body
  );
  res.json({ success: true, data });
});

export const deleteLoan = asyncHandler(async (req: Request, res: Response) => {
  const data = await loanService.deleteLoan(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});