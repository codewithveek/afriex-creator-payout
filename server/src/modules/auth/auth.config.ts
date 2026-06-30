import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../config/db';
import { env } from '../../config/env';
import * as schema from '../../infra/database/schema';
import { logger } from '../../config/logger';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import('../../infra/email/email.service');
      await sendPasswordResetEmail({ user, url });
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

  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',
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

  databaseHooks: {
    user: {
      create: {
        after: async (params: Record<string, unknown>) => {
          const user = params.data as { id: string; email: string };
          logger.info({ userId: user.id, email: user.email }, 'User created');
        },
      },
      update: {
        after: async (params: Record<string, unknown>) => {
          const user = params.data as { id: string; email: string };
          const old = params.oldData as { email?: string } | undefined;
          if (old?.email !== user.email) {
            logger.info({ userId: user.id, oldEmail: old?.email, newEmail: user.email }, 'Email changed');
          }
        },
      },
    },
    session: {
      create: {
        after: async (params: Record<string, unknown>) => {
          const session = params.data as { userId: string; id: string };
          logger.info({ userId: session.userId, sessionId: session.id }, 'Session created');
        },
      },
      delete: {
        before: async (params: Record<string, unknown>) => {
          const session = params.data as { id: string };
          logger.info({ sessionId: session.id }, 'Session deleted');
        },
      },
    },
  },
});

export type Auth = typeof auth;
