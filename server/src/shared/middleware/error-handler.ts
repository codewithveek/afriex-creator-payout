import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors';
import { logger } from '../../config/logger';
import type { ApiErrorResponse } from '../types';

// Registered once in app.ts via fastify.setErrorHandler(). This is the ONLY
// place that translates a thrown error into an HTTP response — controllers
// and services just throw AppError subclasses and never touch `reply`
// directly for error cases.
export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof AppError) {
    const body: ApiErrorResponse = {
      error: { code: error.code, message: error.message },
    };
    if (error.statusCode >= 500) {
      logger.error({ err: error, path: request.url }, 'Unhandled AppError at 5xx');
    }
    return reply.code(error.statusCode).send(body);
  }

  // Zod validation errors thrown outside the validate middleware, or
  // anything else unexpected, are logged with full detail and returned to
  // the client as a generic 500 — never leak internal error messages.
  logger.error({ err: error, path: request.url }, 'Unhandled error');
  const body: ApiErrorResponse = {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  };
  return reply.code(500).send(body);
}
