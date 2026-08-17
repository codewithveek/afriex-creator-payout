import type { FastifyInstance } from 'fastify';
import { payoutMethodsController } from './payout-methods.controller';
import {
  AddPayoutMethodSchema,
  ListInstitutionsSchema,
  ResolveAccountSchema,
} from './payout-methods.schema';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validateBody, validateQuery } from '../../shared/middleware/validate';
import { Role } from '../../shared/types';

export async function payoutMethodsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/payout-methods', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateBody(AddPayoutMethodSchema)],
    handler: payoutMethodsController.addPayoutMethod,
  });

  // Banks / mobile-money providers the creator can pick from, for their country.
  fastify.get('/api/payout-methods/institutions', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateQuery(ListInstitutionsSchema)],
    handler: payoutMethodsController.listInstitutions,
  });

  // Confirms who owns an account number before the creator saves it.
  fastify.post('/api/payout-methods/resolve', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateBody(ResolveAccountSchema)],
    handler: payoutMethodsController.resolveAccount,
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
