// Shared error codes and error classes.
//
// The backend throws these; the API error-handling middleware (built in M2,
// BE-004) catches them and serializes to the standard error envelope defined
// in the API Specification. Clients can match on `code` to branch UI behavior
// without parsing message strings.

export enum ErrorCode {
  // Generic / cross-cutting
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',

  // Auth / identity
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  MFA_REQUIRED = 'MFA_REQUIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Tenant / scope
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',

  // Business rules
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  CASH_SESSION_NOT_OPEN = 'CASH_SESSION_NOT_OPEN',
  ORDER_ALREADY_COMPLETED = 'ORDER_ALREADY_COMPLETED',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',
  ENTITLEMENT_REQUIRED = 'ENTITLEMENT_REQUIRED',

  // Sync (see Offline & Sync Spec, ADR-005)
  SYNC_IDEMPOTENCY_CONFLICT = 'SYNC_IDEMPOTENCY_CONFLICT',
  SYNC_STALE_CLIENT = 'SYNC_STALE_CLIENT',
}

/** Base class for all application errors. Never throw a raw Error for anything
 *  the client needs to branch on — always throw one of these subclasses. */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly httpStatus: number
  readonly details?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.httpStatus = httpStatus
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      ErrorCode.NOT_FOUND,
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      404,
    )
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(ErrorCode.UNAUTHORIZED, message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(ErrorCode.FORBIDDEN, message, 403)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, 409, details)
    this.name = 'ConflictError'
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(ErrorCode.INTERNAL_ERROR, message, 500)
    this.name = 'InternalError'
  }
}
