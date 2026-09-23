import { Router } from 'express';
import { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense } from '../controllers/expenseController';
import { verifyAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyAuth);

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
