import { Router } from 'express';
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from '../controllers/account.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createAccount);
router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;