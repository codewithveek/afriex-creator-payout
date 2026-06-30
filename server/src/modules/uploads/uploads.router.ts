import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { Role } from '../../shared/types';
import { mediaUploader } from '../../infra/media/media-uploader';
import { logger } from '../../config/logger';


export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/api/upload/product-file', {
    preHandler: [authenticate, authorize(Role.CREATOR)],
    handler: async (request, reply) => {
      if (!mediaUploader) {
        return reply.code(400).send({
          error: { code: 'UPLOAD_NOT_CONFIGURED', message: 'File upload is not configured. Set R2 env vars.' },
        });
      }

      const file = await request.file();
      if (!file) {
        return reply.code(422).send({
          error: { code: 'NO_FILE', message: 'No file provided' },
        });
      }

      const buffer = await file.toBuffer();
      const filename = `${Date.now()}-${file.filename}`;

      try {
        const result = await mediaUploader.upload(buffer, {
          filename,
          folder: 'product-files',
          contentType: file.mimetype,
        });

        logger.info({ fileId: result.id, size: result.size }, 'File uploaded');

        return reply.code(201).send({
          data: {
            url: result.url,
            fileName: file.filename,
            fileSize: String(result.size),
          },
        });
      } catch (err) {
        logger.error({ err, filename: file.filename }, 'File upload failed');
        throw err;
      }
    },
  });
}
