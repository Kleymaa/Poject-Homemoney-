import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { exportOperationsReport } from '../controllers/report.controller';

const router = Router();

router.use(authMiddleware);
router.get('/operations/export', exportOperationsReport);

export default router;
