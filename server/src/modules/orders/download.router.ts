import type { FastifyInstance } from 'fastify';
import { ordersService } from './orders.service';
import { productsRepository } from '../products/products.repository';
import { logger } from '../../config/logger';

/**
 * Secure download gate:
 * 1. Validates order + download token + expiry
 * 2. Proxies the file when possible so the permanent storage URL is not exposed
 * 3. Falls back to a redirect only if proxy fails (legacy public R2 URLs)
 */
export async function downloadRoutes(fastify: FastifyInstance) {
  fastify.get('/api/download/:orderId/:token', {
    handler: async (request, reply) => {
      const { orderId, token } = request.params as { orderId: string; token: string };

      const order = await ordersService.verifyDownloadToken(orderId, token);
      const product = await productsRepository.findById(order.productId);
      if (!product?.fileUrl) {
        return reply.code(404).send({
          error: { code: 'NO_FILE', message: 'No file available for this product' },
        });
      }

      const fileName = product.fileName || 'download';

      try {
        const upstream = await fetch(product.fileUrl);
        if (!upstream.ok || !upstream.body) {
          throw new Error(`Upstream fetch failed: ${upstream.status}`);
        }

        const contentType =
          upstream.headers.get('content-type') || 'application/octet-stream';
        const contentLength = upstream.headers.get('content-length');

        reply.header('Content-Type', contentType);
        reply.header(
          'Content-Disposition',
          `attachment; filename="${fileName.replace(/"/g, '')}"`,
        );
        reply.header('Cache-Control', 'private, no-store');
        if (contentLength) reply.header('Content-Length', contentLength);

        // Node fetch body is a web ReadableStream; Fastify accepts it via reply.send
        const buffer = Buffer.from(await upstream.arrayBuffer());
        return reply.send(buffer);
      } catch (err) {
        logger.warn(
          { err, orderId, productId: product.id },
          'File proxy failed; falling back to redirect',
        );
        // Last resort: short-lived redirect (token already validated)
        return reply.redirect(product.fileUrl);
      }
    },
  });
}
