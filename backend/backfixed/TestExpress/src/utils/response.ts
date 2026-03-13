import { Response } from 'express';

export const ok = (res: Response, data?: any, message?: string, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const fail = (res: Response, message: string, details?: any, status = 400) => {
  return res.status(status).json({
    success: false,
    message,
    details,
  });
};