import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as notificationService from '../services/notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationService.getNotifications((req as any).user.id);
  res.json({ success: true, data });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationService.markNotificationAsRead(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const subscribePush = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationService.savePushSubscription(
    (req as any).user.id,
    req.body
  );
  res.status(201).json({ success: true, data });
});