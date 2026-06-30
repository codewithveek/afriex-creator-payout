import type { FastifyInstance } from 'fastify';
import { withdrawalsController } from './withdrawals.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validateBody } from '../../shared/middleware/validate';
import { RequestWithdrawalSchema } from './withdrawals.schema';
import { Role } from '../../shared/types';

export async function withdrawalsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/withdrawals/request', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateBody(RequestWithdrawalSchema)],
    handler: withdrawalsController.requestWithdrawal,
  });

  fastify.get('/api/withdrawals/me', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: withdrawalsController.listMyWithdrawals,
  });
}
