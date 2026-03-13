import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as categoryService from '../services/category.service';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.createCategory((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getCategories((req as any).user.id);
  res.json({ success: true, data });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.updateCategory(
    (req as any).user.id,
    String(req.params.id),
    req.body
  );
  res.json({ success: true, data });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.deleteCategory(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const seedCategories = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.seedCategories((req as any).user.id);
  res.json({ success: true, data });
});