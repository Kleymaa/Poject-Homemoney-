import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import accountRoutes from './account.routes';
import categoryRoutes from './category.routes';
import transactionRoutes from './transaction.routes';
import familyRoutes from './family.routes';
import loanRoutes from './loan.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import actionLogRoutes from './action-log.routes';
import healthRoutes from './health.routes';
import profileRoutes from './profile.routes';
import familyCompatRoutes from './family-compat.routes';
import { getDocsPage, getOpenApiJson } from '../controllers/docs.controller';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'HomeBudget API is running'
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/families', familyRoutes);
router.use('/family', familyCompatRoutes);
router.use('/loans', loanRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/action-logs', actionLogRoutes);
router.use('/profile', profileRoutes);

router.get('/docs', getDocsPage);
router.get('/docs/openapi.json', getOpenApiJson);

export default router;