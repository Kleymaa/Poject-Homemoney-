import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as transactionService from '../services/transaction.service';

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.createTransaction((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.getTransactions((req as any).user.id, req.query);
  res.json({ success: true, data });
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.getTransactionById(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.updateTransaction(
    (req as any).user.id,
    String(req.params.id),
    req.body
  );
  res.json({ success: true, data });
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.deleteTransaction(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.getHistory((req as any).user.id, req.query);
  res.json({ success: true, data });
});

export const quickIncome = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.quickIncome((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const quickExpense = asyncHandler(async (req: Request, res: Response) => {
  const data = await transactionService.quickExpense((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});