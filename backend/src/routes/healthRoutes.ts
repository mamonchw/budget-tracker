import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json(
    ApiResponse.success({
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  );
});

export default router;
