import type { FastifyRequest, FastifyReply } from 'fastify';
import { customersService } from './customers.service';
import type { CustomerSignupInput, CustomerLoginInput } from './customers.schema';

export const customersController = {
  async signup(request: FastifyRequest<{ Body: CustomerSignupInput }>, reply: FastifyReply) {
    const customer = await customersService.signup(request.body);
    return reply.code(201).send({ data: { id: customer.id, email: customer.email, name: customer.name } });
  },

  async login(request: FastifyRequest<{ Body: CustomerLoginInput }>, reply: FastifyReply) {
    const customer = await customersService.login(request.body);
    return reply.code(200).send({ data: { id: customer.id, email: customer.email, name: customer.name } });
  },

  async myOrders(request: FastifyRequest, reply: FastifyReply) {
    const customerEmail = request.headers['x-customer-email'] as string;
    if (!customerEmail) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Customer email required' } });
    }
    const orders = await customersService.getOrders(customerEmail);
    return reply.code(200).send({ data: orders });
  },
};
