import { Router } from 'express';
import { createBudget, getBudgets, getBudgetById, updateBudget, deleteBudget } from '../controllers/budgetController';
import { verifyAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyAuth);

router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/:id', getBudgetById);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
