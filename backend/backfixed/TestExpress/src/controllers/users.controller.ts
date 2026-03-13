import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as usersService from '../services/users.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.getMe((req as any).user.id);
  res.json({ success: true, data });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.updateMe((req as any).user.id, req.body);
  res.json({ success: true, data });
});