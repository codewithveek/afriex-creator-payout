import type { FastifyInstance } from 'fastify';
import { creatorsController } from './creators.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { Role } from '../../shared/types';

export async function creatorsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/creators/me', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: creatorsController.getMyProfile,
  });

  fastify.patch('/api/creators/me', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: creatorsController.updateMyProfile,
  });
}
