import type { FastifyInstance } from 'fastify';
import { productsController } from './products.controller';
import { CreateProductSchema, UpdateProductSchema } from './products.schema';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validateBody } from '../../shared/middleware/validate';
import { Role } from '../../shared/types';

export async function productsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/products', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateBody(CreateProductSchema)],
    handler: productsController.create,
  });

  fastify.get('/api/products/mine', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: productsController.listMyProducts,
  });

  fastify.get('/api/products', {
    handler: productsController.listPublished,
  });

  fastify.get('/api/products/:id', {
    handler: productsController.getById,
  });

  fastify.patch('/api/products/:id', {
    preHandler: [authenticate, authorize(Role.CREATOR), validateBody(UpdateProductSchema)],
    handler: productsController.update,
  });

  fastify.delete('/api/products/:id', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: productsController.delete,
  });
}
