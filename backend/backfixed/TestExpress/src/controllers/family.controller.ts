import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as familyService from '../services/family.service';

export const createFamily = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.createFamily((req as any).user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getMyFamily = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.getMyFamily((req as any).user.id);
  res.json({ success: true, data });
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.inviteMember(
    (req as any).user.id,
    String(req.params.id),
    req.body
  );
  res.status(201).json({ success: true, data });
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.acceptInvitation(
    (req as any).user.id,
    String(req.params.token)
  );
  res.json({ success: true, data });
});

export const getFamilyMembers = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.getFamilyMembers(
    (req as any).user.id,
    String(req.params.id)
  );
  res.json({ success: true, data });
});

export const changeMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.changeMemberRole(
    (req as any).user.id,
    String(req.params.id),
    String(req.params.memberId),
    req.body.role
  );
  res.json({ success: true, data });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const data = await familyService.removeMember(
    (req as any).user.id,
    String(req.params.id),
    String(req.params.memberId)
  );
  res.json({ success: true, data });
});