import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../config/db';
import { env } from '../../config/env';
import * as schema from '../../infra/database/schema';

// better-auth owns its own session/account/verification tables (created via
// its own migration CLI, separate from our drizzle-kit schema). We point it
// at the same Postgres database and reuse our `users` table by mapping the
// `role` custom field onto it, so a single users table serves both
// better-auth's identity needs and our domain's role-based access control.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // relaxed for v1 happy path; tighten before production
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'CREATOR',
        input: false, // never settable by the client at signup — only an
        // admin action (or a trusted server-side script) can promote a
        // user to ADMIN. Prevents privilege escalation via signup payload.
      },
    },
  },

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  trustedOrigins: [env.BETTER_AUTH_URL],
});

export type Auth = typeof auth;
