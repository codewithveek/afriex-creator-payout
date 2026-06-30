import type { FastifyRequest, FastifyReply } from 'fastify';
import { customersService } from '../../modules/customers/customers.service';
import { UnauthorizedError } from '../errors';
import type { Customer } from '../../modules/customers/customers.repository';

declare module 'fastify' {
  interface FastifyRequest {
    customer?: Customer;
  }
}

export async function customerAuth(request: FastifyRequest, _reply: FastifyReply) {
  const token = request.headers['x-customer-token'] as string | undefined;
  if (!token) {
    throw new UnauthorizedError('Customer token required');
  }

  const customer = await customersService.validateSessionToken(token);
  if (!customer) {
    throw new UnauthorizedError('Invalid or expired customer token');
  }

  request.customer = customer;
}
