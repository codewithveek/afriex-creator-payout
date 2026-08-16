import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { users, sessions, accounts, verifications } from '../../infra/database/schema';
import { logger } from '../../config/logger';
import { sendWelcomeEmail, sendVerificationEmail } from '../../infra/email/email.service';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    // Mapped explicitly rather than passing `import * as schema`. The adapter
    // resolves a model by direct key lookup (`schema[model]`) with no
    // singular/plural fallback, so a barrel export of `users`/`sessions`/...
    // leaves it unable to find "user" and every auth call 500s.
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Gated on the environment: outside production RESEND_API_KEY is a
    // placeholder, so no verification mail can actually be delivered and
    // requiring it would lock every local account out of sign-in.
    requireEmailVerification: env.NODE_ENV === 'production',
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import('../../infra/email/email.service');
      await sendPasswordResetEmail({ user, url });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ user, url });
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'CREATOR',
        input: false,
      },
    },
  },

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
  ],

  // Use memory storage — secondary-storage was configured without a Redis
  // secondary store, which silently disabled rate limits.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'memory',
    customRules: {
      '/api/auth/sign-in/email': { window: 60, max: 5 },
      '/api/auth/sign-up/email': { window: 60, max: 3 },
      '/api/auth/request-password-reset': { window: 60, max: 3 },
      '/api/auth/reset-password': { window: 60, max: 3 },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: 'jwe',
    },
  },

  account: {
    encryptOAuthTokens: true,
  },

  advanced: {
    // `users.id` and the auth tables are `uuid ... defaultRandom()`. better-auth's
    // own generator emits short non-UUID strings that postgres rejects on
    // insert; 'uuid' makes it omit the column and let the default fire.
    database: {
      generateId: 'uuid',
    },
    disableCSRFCheck: false,
    useSecureCookies: env.NODE_ENV === 'production',
    cookiePrefix: 'acp',
    defaultCookieAttributes: {
      sameSite: 'lax',
      path: '/',
    },
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
      disableIpTracking: false,
    },
  },

  // Hooks receive the affected row itself, not a `{ data, oldData }` wrapper.
  // These were previously written against the latter shape, so the user
  // create.after hook threw on `params.data.name` and turned every single
  // sign-up into a 500 — after the row had already been inserted.
  databaseHooks: {
    user: {
      create: {
        after: async (user: { id: string; email: string; name?: string }) => {
          if (user.name) {
            await sendWelcomeEmail({ id: user.id, email: user.email, name: user.name });
          }
          logger.info({ userId: user.id, email: user.email }, 'User created, welcome email sent');
        },
      },
      update: {
        after: async (user: { id: string; email: string }) => {
          // The previous row isn't passed to this hook, so "did the email
          // change" can't be answered here — log the current value only.
          logger.info({ userId: user.id, email: user.email }, 'User updated');
        },
      },
    },
    session: {
      create: {
        after: async (session: { userId: string; id: string }) => {
          logger.info({ userId: session.userId, sessionId: session.id }, 'Session created');
        },
      },
      delete: {
        before: async (session: { id: string }) => {
          logger.info({ sessionId: session.id }, 'Session deleted');
        },
      },
    },
  },
});

export type Auth = typeof auth;
