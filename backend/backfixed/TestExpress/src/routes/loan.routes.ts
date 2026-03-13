import { Router } from 'express';
import {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
} from '../controllers/loan.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createLoan);
router.get('/', getLoans);
router.get('/:id', getLoanById);
router.patch('/:id', updateLoan);
router.delete('/:id', deleteLoan);

export default router;