import type { FastifyInstance } from 'fastify';
import { salesController } from './sales.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { Role } from '../../shared/types';

export async function salesRoutes(fastify: FastifyInstance) {
  // Payment webhook signature verification requires the EXACT raw request
  // body bytes, not the JSON-parsed object Fastify produces by default.
  // This content-type parser is scoped to this route only (registered
  // inside this plugin, not globally in app.ts) so every other route keeps
  // normal JSON parsing.
  fastify.register(async (instance) => {
    instance.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_request, body, done) => done(null, body),
    );

    instance.post('/api/webhooks/payment', {
      handler: salesController.handlePaymentWebhook,
    });
  });

  fastify.get('/api/sales/me', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: salesController.listMySales,
  });
}
