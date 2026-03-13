import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as actionLogService from '../services/action-log.service';

export const getActionLogs = asyncHandler(async (req: Request, res: Response) => {
  const data = await actionLogService.getActionLogs(
    (req as any).user.id,
    req.query.familyId ? String(req.query.familyId) : undefined
  );

  res.json({ success: true, data });
});