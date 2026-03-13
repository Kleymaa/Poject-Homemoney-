import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  profileController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

router.get('/profile', authMiddleware, profileController);

router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;