import type { FastifyInstance } from 'fastify';
import { ordersController } from './orders.controller';
import { CreateCheckoutSessionSchema } from './orders.schema';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validateBody } from '../../shared/middleware/validate';
import { Role } from '../../shared/types';

export async function ordersRoutes(fastify: FastifyInstance) {
  fastify.get('/api/checkout/collectors', {
    handler: ordersController.listCollectors,
  });

  fastify.post('/api/checkout/sessions', {
    preHandler: [validateBody(CreateCheckoutSessionSchema)],
    handler: ordersController.createCheckoutSession,
  });

  fastify.get('/api/orders/by-session/:sessionId', {
    handler: ordersController.getOrderBySession,
  });

  fastify.get('/api/orders/mine', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: ordersController.listMyOrders,
  });
}
