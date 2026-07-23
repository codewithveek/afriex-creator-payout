import type { FastifyRequest, FastifyReply } from 'fastify';
import { customersService } from '../../modules/customers/customers.service';
import { UnauthorizedError } from '../errors';
import type { DecryptedCustomer } from '../../modules/customers/customers.repository';

declare module 'fastify' {
  interface FastifyRequest {
    customer?: DecryptedCustomer;
  }
}

export async function customerAuth(request: FastifyRequest, _reply: FastifyReply) {
  const token = request.headers['x-customer-token'] as string | undefined;
  if (!token || token.length < 32) {
    throw new UnauthorizedError('Customer token required');
  }

  const customer = await customersService.validateSessionToken(token);
  if (!customer) {
    throw new UnauthorizedError('Invalid or expired customer token');
  }

  request.customer = customer;
}
