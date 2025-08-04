// Standardized error classes for consistent error handling

export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.field = field;
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, originalError?: Error) {
    super(`Database operation failed: ${message}`, 500);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class ExternalServiceError extends BaseError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`External service ${service} error: ${message}`, 502);
    this.service = service;
  }
}

// Error handler middleware type
export interface ErrorHandlerOptions {
  showStackTrace?: boolean;
  logErrors?: boolean;
  customErrorMessages?: Record<string, string>;
}

// Error response format
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    field?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Utility function to create standardized error responses
export function createErrorResponse(
  error: BaseError | Error,
  requestId?: string
): ErrorResponse {
  const isBaseError = error instanceof BaseError;
  
  return {
    error: {
      message: error.message,
      code: isBaseError ? error.constructor.name : 'InternalError',
      field: error instanceof ValidationError ? error.field : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

// Type guards for error handling
export function isOperationalError(error: Error): error is BaseError {
  return error instanceof BaseError && error.isOperational;
}

export function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: Error): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isUnauthorizedError(error: Error): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}