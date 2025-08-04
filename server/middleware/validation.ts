import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@shared/errors';
import { fromZodError } from 'zod-validation-error';

export interface ValidatedRequest<T> extends Request {
  validatedBody: T;
}

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      (req as ValidatedRequest<T>).validatedBody = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(fromZodError(error).message);
        return next(validationError);
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      (req as any).validatedQuery = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(fromZodError(error).message);
        return next(validationError);
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      (req as any).validatedParams = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(fromZodError(error).message);
        return next(validationError);
      }
      next(error);
    }
  };
}