import type { Request, Response, NextFunction } from 'express';
import { BaseError, createErrorResponse, isOperationalError } from '@shared/errors';

export interface ErrorHandlerOptions {
  showStackTrace?: boolean;
  logErrors?: boolean;
}

export function errorHandler(options: ErrorHandlerOptions = {}) {
  const { showStackTrace = false, logErrors = true } = options;

  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    // Log error for debugging
    if (logErrors) {
      console.error(`Error ${req.method} ${req.path}:`, error);
    }

    // Handle operational errors (expected errors)
    if (isOperationalError(error)) {
      const errorResponse = createErrorResponse(error, req.headers['x-request-id'] as string);
      return res.status(error.statusCode).json(errorResponse);
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse(
      new BaseError('Internal server error', 500, false),
      req.headers['x-request-id'] as string
    );

    // Add stack trace in development
    if (showStackTrace && process.env.NODE_ENV === 'development') {
      errorResponse.error.details = { stack: error.stack };
    }

    res.status(500).json(errorResponse);
  };
}

// Async error wrapper to catch promise rejections
export function asyncHandler<T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}