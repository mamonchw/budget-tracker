import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/ApiResponse';

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'Access token is missing or invalid.'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(ApiResponse.error('TOKEN_EXPIRED', 'Access token has expired.'));
    }
    return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'Invalid access token.'));
  }
};
