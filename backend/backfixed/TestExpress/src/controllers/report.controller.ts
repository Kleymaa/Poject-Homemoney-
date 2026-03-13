import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as reportService from '../services/report.service';

export const exportOperationsReport = asyncHandler(async (req: Request, res: Response) => {
  const format = ((req.query.format as 'xlsx' | 'pdf') || 'xlsx');
  const report = await reportService.exportOperationsReport(
    (req as any).user.id,
    format,
    req.query
  );

  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
  res.send(report.buffer);
});