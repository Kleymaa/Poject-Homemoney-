import { Request, Response } from 'express';
import { pool } from '../db';

export const health = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'OK',
  });
};

export const ready = async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      success: true,
      message: 'READY',
      db: 'connected',
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'NOT_READY',
      db: 'connection_failed',
    });
  }
};