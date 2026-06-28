import type { FastifyInstance } from 'fastify';
import { withdrawalsController } from './withdrawals.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { Role } from '../../shared/types';

export async function withdrawalsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/withdrawals/request', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: withdrawalsController.requestWithdrawal,
  });

  fastify.get('/api/withdrawals/me', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: withdrawalsController.listMyWithdrawals,
  });
}
