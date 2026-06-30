import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { globalErrorHandler } from './shared/middleware/error-handler';
import { authRoutes } from './modules/auth/auth.router';
import { creatorsRoutes } from './modules/creators/creators.router';
import { payoutMethodsRoutes } from './modules/payout-methods/payout-methods.router';
import { salesRoutes } from './modules/sales/sales.router';
import { withdrawalsRoutes } from './modules/withdrawals/withdrawals.router';
import { adminRoutes } from './modules/admin/admin.router';
import { afriexWebhookRoutes } from './infra/afriex/afriex-webhook.router';
import { productsRoutes } from './modules/products/products.router';
import { ordersRoutes } from './modules/orders/orders.router';
import { downloadRoutes } from './modules/orders/download.router';
import { customersRoutes } from './modules/customers/customers.router';
import { env } from './config/env';

// Per the architecture guide: "app.ts — register plugins, modules — no
// logic." Every router import above is a self-contained Fastify plugin;
// this function's only job is wiring them together.
//
// Fastify builds its own internal pino instance from these options rather
// than receiving our pre-built `logger` from config/logger.ts — injecting a
// foreign pino instance via `loggerInstance` fights Fastify's own generic
// logger typing (FastifyBaseLogger vs a plain pino.Logger don't structurally
// match). Our shared `logger` is still used everywhere outside the HTTP
// request lifecycle (services, the worker process, the scheduler).
export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
          : undefined,
    },
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.NODE_ENV === 'production' ? false : true, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.setErrorHandler(globalErrorHandler);

  app.get('/health', async () => ({ data: { status: 'ok' } }));

  await app.register(authRoutes);
  await app.register(creatorsRoutes);
  await app.register(payoutMethodsRoutes);
  await app.register(salesRoutes);
  await app.register(withdrawalsRoutes);
  await app.register(adminRoutes);
  await app.register(productsRoutes);
  await app.register(ordersRoutes);
  await app.register(downloadRoutes);
  await app.register(customersRoutes);
  await app.register(afriexWebhookRoutes);

  return app;
}
