import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import multer from 'multer';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  console.error('Unhandled Error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}; 