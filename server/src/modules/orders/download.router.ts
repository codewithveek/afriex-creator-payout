import type { FastifyInstance } from 'fastify';
import { ordersService } from './orders.service';
import { productsRepository } from '../products/products.repository';

export async function downloadRoutes(fastify: FastifyInstance) {
  fastify.get('/api/download/:orderId/:token', {
    handler: async (request, reply) => {
      const { orderId, token } = request.params as { orderId: string; token: string };

      const order = await ordersService.verifyDownloadToken(orderId, token);
      const product = await productsRepository.findById(order.productId);
      if (!product?.fileUrl) {
        return reply.code(404).send({ error: { code: 'NO_FILE', message: 'No file available for this product' } });
      }

      return reply.redirect(product.fileUrl);
    },
  });
}
