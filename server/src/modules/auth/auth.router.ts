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

      const response = await auth.handler(
        new Request(url, {
          method: request.method,
          headers: toWebHeaders(request.headers),
          // `request.body` is undefined for a POST sent without one;
          // JSON.stringify would turn that into the literal string
          // "undefined", which better-auth then fails to parse.
          body:
            ['GET', 'HEAD'].includes(request.method) || request.body === undefined
              ? undefined
              : JSON.stringify(request.body),
        }),
      );

      reply.status(response.status);

      // Set-Cookie has to be forwarded separately. `Headers.forEach` collapses
      // repeated headers into one comma-joined value, which mangles cookie
      // attributes and loses every cookie after the first — the session cookie
      // then never reaches the browser and sign-in appears to silently fail.
      const setCookie = response.headers.getSetCookie();
      if (setCookie.length > 0) reply.header('set-cookie', setCookie);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'set-cookie') reply.header(key, value);
      });

      return reply.send(await response.text());
    },
  });

  // better-auth fires database hooks on user creation. Rather than wiring
  // into its hook system (which varies by version), v1 takes the simpler,
  // explicit route: a dedicated endpoint the frontend calls immediately
  // after a successful signup, which provisions the `creators` row for that
  // user. This keeps "what happens after signup" visible and debuggable
  // instead of buried in a plugin hook.
  fastify.post('/api/onboarding/provision-creator', async (request, reply) => {
    // A cast of Fastify's plain header object to `Headers` type-checks but
    // has none of the methods better-auth calls on it, so the lookup always
    // came back null and provisioning 401'd after a successful signup.
    const session = await auth.api.getSession({ headers: toWebHeaders(request.headers) });
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

/** Fastify's IncomingHttpHeaders -> the WHATWG `Headers` better-auth expects. */
function toWebHeaders(raw: Record<string, string | string[] | undefined>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else headers.append(key, value);
  }
  return headers;
}
