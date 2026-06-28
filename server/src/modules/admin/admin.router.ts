import type { FastifyInstance } from 'fastify';
import { adminController } from './admin.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { Role } from '../../shared/types';

export async function adminRoutes(fastify: FastifyInstance) {
  const adminOnly = [authenticate, authorize(Role.ADMIN)];

  fastify.get('/api/admin/creators', { preHandler: adminOnly, handler: adminController.listCreators });
  fastify.get('/api/admin/withdrawals', { preHandler: adminOnly, handler: adminController.listWithdrawals });
  fastify.get('/api/admin/sales', { preHandler: adminOnly, handler: adminController.listSales });
  fastify.get('/api/admin/pool-accounts', { preHandler: adminOnly, handler: adminController.listPoolAccounts });
  fastify.post('/api/admin/sweep/trigger', {
    preHandler: adminOnly,
    handler: adminController.triggerScheduledSweep,
  });
}
