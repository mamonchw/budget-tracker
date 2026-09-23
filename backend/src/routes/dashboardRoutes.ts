import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { verifyAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyAuth);
router.get('/summary', getDashboardSummary);

export default router;
