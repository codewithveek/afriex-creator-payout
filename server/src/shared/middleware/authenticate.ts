import type { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../../modules/auth/auth.config';
import { UnauthorizedError } from '../errors';

// Augments Fastify's request type so every downstream handler can read
// `request.user` without re-verifying the session. This file is the ONLY
// place session verification happens — controllers never call better-auth
// directly, per the layer contract: "Router: declare route, attach
// middleware, delegate to controller."
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: 'CREATOR' | 'ADMIN';
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const session = await auth.api.getSession({
    headers: request.headers as unknown as Headers,
  });

  if (!session?.user) {
    throw new UnauthorizedError('Authentication required');
  }

  request.user = {
    id: session.user.id,
    email: session.user.email,
    // better-auth stores custom fields (role) on the user object via the
    // additionalFields config in auth.config.ts.
    role: (session.user as unknown as { role: 'CREATOR' | 'ADMIN' }).role,
  };
}
