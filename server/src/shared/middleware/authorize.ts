import type { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { Role } from '../types';

// authorize(Role.ADMIN) returns a preHandler. Must run after `authenticate`
// in the preHandler chain, since it reads `request.user` set there.
export function authorize(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      // Defensive: should be unreachable if authenticate() ran first, but
      // never trust ordering implicitly in a preHandler array.
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(request.user.role as Role)) {
      throw new ForbiddenError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      );
    }
  };
}
