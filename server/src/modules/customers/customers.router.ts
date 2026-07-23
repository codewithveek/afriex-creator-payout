import type { FastifyInstance } from 'fastify';
import { customersController } from './customers.controller';
import { CustomerSignupSchema, CustomerLoginSchema } from './customers.schema';
import { validateBody } from '../../shared/middleware/validate';
import { customerAuth } from '../../shared/middleware/customer-auth';

export async function customersRoutes(fastify: FastifyInstance) {
  fastify.post('/api/customers/signup', {
    preHandler: [validateBody(CustomerSignupSchema)],
    handler: customersController.signup,
  });

  fastify.post('/api/customers/login', {
    preHandler: [validateBody(CustomerLoginSchema)],
    handler: customersController.login,
  });

  fastify.get('/api/customers/orders', {
    preHandler: [customerAuth],
    handler: customersController.myOrders,
  });

  fastify.post('/api/customers/orders/:orderId/renew-download', {
    preHandler: [customerAuth],
    handler: customersController.renewDownload,
  });
}
