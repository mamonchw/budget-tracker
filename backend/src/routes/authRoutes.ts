import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { verifyAuth } from '../middleware/authMiddleware';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// A simple test route to verify token validation works
router.get('/me', verifyAuth, (req, res) => {
  res.json(ApiResponse.success({ userId: req.userId }));
});

export default router;
