import type { FastifyInstance } from 'fastify';
import { ordersService } from './orders.service';
import { productsRepository } from '../products/products.repository';
import { logger } from '../../config/logger';
import { assertSafeStorageRedirectUrl } from '../../shared/utils/safe-redirect';
import { ValidationError } from '../../shared/errors';

/**
 * Secure download gate:
 * 1. Validates order + download token hash + expiry
 * 2. Proxies the file when possible so permanent storage URLs stay hidden
 * 3. Redirect fallback only to allowlisted storage origins (no open redirect)
 */
export async function downloadRoutes(fastify: FastifyInstance) {
  fastify.get('/api/download/:orderId/:token', {
    handler: async (request, reply) => {
      const { orderId, token } = request.params as { orderId: string; token: string };

      if (!/^[0-9a-f-]{36}$/i.test(orderId) || !/^[0-9a-f]{32,128}$/i.test(token)) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Invalid or expired download link' },
        });
      }

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
        if (!upstream.ok) {
          throw new Error(`Upstream fetch failed: ${upstream.status}`);
        }

        const contentType =
          upstream.headers.get('content-type') || 'application/octet-stream';
        const contentLength = upstream.headers.get('content-length');

        reply.header('Content-Type', contentType);
        reply.header(
          'Content-Disposition',
          `attachment; filename="${fileName.replace(/[^\w.\- ()[\]]+/g, '_')}"`,
        );
        reply.header('Cache-Control', 'private, no-store');
        reply.header('X-Content-Type-Options', 'nosniff');
        if (contentLength) reply.header('Content-Length', contentLength);

        const buffer = Buffer.from(await upstream.arrayBuffer());
        return reply.send(buffer);
      } catch (err) {
        logger.warn(
          { err, orderId, productId: product.id },
          'File proxy failed; attempting allowlisted redirect',
        );
        try {
          const safeUrl = assertSafeStorageRedirectUrl(product.fileUrl);
          return reply.redirect(safeUrl);
        } catch (redirectErr) {
          logger.error(
            { redirectErr, orderId },
            'Download redirect blocked (storage origin not allowlisted)',
          );
          if (redirectErr instanceof ValidationError) {
            return reply.code(502).send({
              error: {
                code: 'DOWNLOAD_UNAVAILABLE',
                message: 'File temporarily unavailable. Please try again or contact support.',
              },
            });
          }
          throw redirectErr;
        }
      }
    },
  });
}
