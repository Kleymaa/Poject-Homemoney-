import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getHistory,
  quickIncome,
  quickExpense,
} from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/history', getHistory);
router.get('/:id', getTransactionById);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/quick-income', quickIncome);
router.post('/quick-expense', quickExpense);

export default router;