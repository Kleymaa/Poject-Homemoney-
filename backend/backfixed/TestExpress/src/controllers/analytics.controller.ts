import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as analyticsService from '../services/analytics.service';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getSummary((req as any).user.id, req.query);
  res.json({ success: true, data });
});

export const getCategoryAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getCategoryAnalytics((req as any).user.id, req.query);
  res.json({ success: true, data });
});