import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
