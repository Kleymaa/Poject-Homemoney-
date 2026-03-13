import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  subscribePush,
} from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/push-subscribe', subscribePush);

export default router;