import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ZodType } from 'zod/v4';
import { ValidationError } from '../errors';

// validateBody(SomeZodSchema) returns a preHandler that parses request.body
// through the schema and REPLACES request.body with the parsed (typed,
// defaulted, coerced) result. Controllers then trust request.body completely
// — they never re-validate, per the layer contract.
export function validateBody<T>(schema: ZodType<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new ValidationError(
        firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid request body',
      );
    }
    request.body = result.data;
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new ValidationError(
        firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid query parameters',
      );
    }
    request.query = result.data as typeof request.query;
  };
}
