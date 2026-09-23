import { Router } from 'express';
import { getMonthlyReport, getYearlyReport } from '../controllers/reportController';
import { verifyAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyAuth);

router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);

export default router;
