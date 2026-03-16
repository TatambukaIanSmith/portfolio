import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Middleware to handle validation results from express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    logger.warn('Validation failed:', {
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip,
      errors: errorMessages,
      body: req.body
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'The request contains invalid data',
      errors: errorMessages
    });
  }

  next();
};