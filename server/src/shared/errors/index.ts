// AppError is the base for every error a service is allowed to throw.
// `statusCode` lets the global Fastify error handler (shared/middleware)
// map any AppError straight to an HTTP response without each controller
// needing its own try/catch translation logic — that translation lives in
// exactly one place.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// DomainError is the base for business-rule violations specifically (as
// distinct from generic HTTP-shaped errors above). Kept as a separate base
// class per the architecture guide's "AppError, DomainError base classes"
// folder convention, so domain modules can catch business-rule failures
// distinctly from infrastructure-shaped ones if ever needed.
export class DomainError extends AppError {
  constructor(message: string, code: string) {
    super(message, 422, code);
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor(available: string, requested: string) {
    super(
      `Insufficient balance: available ${available}, requested ${requested}`,
      'INSUFFICIENT_BALANCE',
    );
  }
}

export class WithdrawalCooldownError extends DomainError {
  constructor(retryAfterHours: number) {
    super(
      `Withdrawal cooldown active. Try again in approximately ${retryAfterHours} hour(s).`,
      'WITHDRAWAL_COOLDOWN_ACTIVE',
    );
  }
}

export class BelowMinimumWithdrawalError extends DomainError {
  constructor(minimum: string) {
    super(`Withdrawal amount is below the minimum of ${minimum}`, 'BELOW_MINIMUM_WITHDRAWAL');
  }
}

export class NoVerifiedPayoutMethodError extends DomainError {
  constructor() {
    super(
      'No verified payout method on file. Add and verify a payout method before withdrawing.',
      'NO_VERIFIED_PAYOUT_METHOD',
    );
  }
}

export class DuplicateSaleError extends DomainError {
  constructor(stripePaymentIntentId: string) {
    super(`Sale already processed for payment intent ${stripePaymentIntentId}`, 'DUPLICATE_SALE');
  }
}
