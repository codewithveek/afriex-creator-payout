import type { FastifyRequest, FastifyReply } from 'fastify';
import { customersService } from './customers.service';
import type { CustomerSignupInput, CustomerLoginInput } from './customers.schema';
import { ValidationError } from '../../shared/errors';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';

export const customersController = {
  async signup(request: FastifyRequest<{ Body: CustomerSignupInput }>, reply: FastifyReply) {
    const customer = await customersService.signup(request.body);
    return reply.code(201).send({ data: { id: customer.id, email: customer.email, name: customer.name } });
  },

  async login(request: FastifyRequest<{ Body: CustomerLoginInput }>, reply: FastifyReply) {
    const result = await customersService.login(request.body);
    return reply.code(200).send({
      data: { id: result.id, email: result.email, name: result.name, token: result.token },
    });
  },

  async myOrders(request: FastifyRequest, reply: FastifyReply) {
    const customer = request.customer!;
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await customersService.getOrders(customer.email, (pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },
};
