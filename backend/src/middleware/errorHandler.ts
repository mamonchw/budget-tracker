import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error]:', err);

  // If it's a known operational error, we can handle it cleanly
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json(ApiResponse.error(code, message, err.details));
};
