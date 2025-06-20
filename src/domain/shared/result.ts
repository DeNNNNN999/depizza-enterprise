import { Result as NeverthrowResult, ok, err } from 'neverthrow';

export type Result<T, E = Error> = NeverthrowResult<T, E>;
export const Ok = ok;
export const Err = err;

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', { field });
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', {
      resource,
      id,
    });
  }
}

export class AlreadyExistsError extends DomainError {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      'ALREADY_EXISTS',
      { resource, field, value }
    );
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, details?: Record<string, unknown>) {
    super(`Business rule violation: ${rule}`, 'BUSINESS_RULE_VIOLATION', details);
  }
}