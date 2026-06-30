import type { FastifyInstance } from 'fastify';
import { auth } from './auth.config';
import { creatorsService } from '../creators/creators.service';
import { logger } from '../../config/logger';

// better-auth ships its own complete set of routes (signup, login, logout,
// session, etc.) under /api/auth/*. We mount its handler directly rather
// than reimplementing routing/controller/service layers for it — there is
// no business logic to add at this layer, only a side effect after signup.
export async function authRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    handler: async (request, reply) => {
      const url = new URL(request.url, env_base(request));
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.append(key, Array.isArray(value) ? value.join(',') : value);
      }

      const response = await auth.handler(
        new Request(url, {
          method: request.method,
          headers,
          body: ['GET', 'HEAD'].includes(request.method)
            ? undefined
            : JSON.stringify(request.body),
        }),
      );

      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      const body = await response.text();
      return reply.send(body);
    },
  });

  // better-auth fires database hooks on user creation. Rather than wiring
  // into its hook system (which varies by version), v1 takes the simpler,
  // explicit route: a dedicated endpoint the frontend calls immediately
  // after a successful signup, which provisions the `creators` row for that
  // user. This keeps "what happens after signup" visible and debuggable
  // instead of buried in a plugin hook.
  fastify.post('/api/onboarding/provision-creator', async (request, reply) => {
    const session = await auth.api.getSession({ headers: request.headers as unknown as Headers });
    if (!session?.user) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not signed in' } });
    }

    const body = request.body as { phone?: string; country?: string } | undefined;
    const creator = await creatorsService.ensureCreatorRecord(session.user.id, body?.phone, body?.country);
    logger.info({ creatorId: creator.id, userId: session.user.id }, 'Creator record provisioned');

    return reply.code(201).send({ data: creator });
  });
}

function env_base(request: { protocol?: string; hostname: string }): string {
  const protocol = request.protocol ?? 'http';
  return `${protocol}://${request.hostname}`;
}
