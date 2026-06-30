import type { FastifyRequest, FastifyReply } from 'fastify';
import { ordersService } from './orders.service';
import { creatorsService } from '../creators/creators.service';
import type { CreateCheckoutSessionInput } from './orders.schema';

export const ordersController = {
  async createCheckoutSession(
    request: FastifyRequest<{ Body: CreateCheckoutSessionInput }>,
    reply: FastifyReply,
  ) {
    const result = await ordersService.createCheckoutSession(request.body);
    return reply.code(201).send({ data: result });
  },

  async listMyOrders(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const orders = await ordersService.listForCreator(creator.id);
    return reply.code(200).send({ data: orders });
  },
};
