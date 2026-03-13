import { Router } from 'express';
import { getSummary, getCategoryAnalytics } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/categories', getCategoryAnalytics);

export default router;