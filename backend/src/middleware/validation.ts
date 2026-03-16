import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        throw new AppError(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`, 400);
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate query parameters against a Zod schema
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        throw new AppError(`Query validation failed: ${errorMessages.map(e => e.message).join(', ')}`, 400);
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate URL parameters against a Zod schema
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        throw new AppError(`Parameter validation failed: ${errorMessages.map(e => e.message).join(', ')}`, 400);
      }
      next(error);
    }
  };
};