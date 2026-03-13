import { NextFunction, Request, Response } from 'express';
import { getUserFamilyRole } from '../services/permission.service';
import { AppError } from '../utils/AppError';
import { FamilyRole } from '../types/common.types';

export const familyRoleMiddleware =
  (...allowedRoles: FamilyRole[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const familyId = req.params.id || req.body.familyId || req.query.familyId;

      if (!familyId) {
        return next(new AppError('Family id is required', 400));
      }

      const role = await getUserFamilyRole(
        (req as any).user.id,
        String(familyId)
      );

      if (!role || !allowedRoles.includes(role)) {
        return next(new AppError('Forbidden', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };