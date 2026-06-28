import type { FastifyInstance } from 'fastify';
import { payoutMethodsController } from './payout-methods.controller';
import { AddPayoutMethodSchema } from './payout-methods.schema';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validateBody } from '../../shared/middleware/validate';
import { Role } from '../../shared/types';

export async function payoutMethodsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/payout-methods', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateBody(AddPayoutMethodSchema)],
    handler: payoutMethodsController.addPayoutMethod,
  });

  fastify.get('/api/payout-methods', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: payoutMethodsController.listMyPayoutMethods,
  });

  fastify.delete('/api/payout-methods/:id', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: payoutMethodsController.revoke,
  });
}
