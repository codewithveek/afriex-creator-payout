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

  // A buyer's library. Any signed-in account can have one — selling is a
  // capability of the same account, not a separate identity.
  fastify.get('/api/library', {
    preHandler: [authenticate],
    handler: ordersController.listMyPurchases,
  });

  fastify.post('/api/library/:orderId/renew-download', {
    preHandler: [authenticate],
    handler: ordersController.renewPurchaseDownload,
  });

  // The creator-side view: orders placed with them.
  fastify.get('/api/orders/mine', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: ordersController.listMyOrders,
  });
}
