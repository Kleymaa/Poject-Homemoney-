import { Router } from 'express';
import { getActionLogs } from '../controllers/action-log.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getActionLogs);

export default router;