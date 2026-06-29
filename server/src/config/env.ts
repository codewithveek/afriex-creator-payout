import { z } from 'zod/v4';

// Validated once at boot. Every other module imports `env` from here instead
// of touching process.env directly — this is the single source of truth for
// "is our configuration valid", and it fails loudly at startup rather than
// surfacing as a confusing runtime error three layers deep in a service.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  AFRIEX_API_KEY: z.string().min(1),
  AFRIEX_ENVIRONMENT: z.enum(['staging', 'production']).optional().default('staging'),
  AFRIEX_WEBHOOK_PUBLIC_KEY: z.string().min(1),

  PAYOUT_SECRETS_ENCRYPTION_KEY: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  WITHDRAWAL_MIN_AMOUNT_MINOR: z.coerce.number().int().positive().default(500),
  WITHDRAWAL_COOLDOWN_HOURS: z.coerce.number().int().positive().default(24),
  SCHEDULED_DISBURSEMENT_CADENCE: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),

  // Percentage of gross sale amount retained as platform fee. Stored on
  // every earnings row at the rate in effect when the sale was processed —
  // see infra/database/schema/earnings.ts for why this matters.
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(10),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = typeof env;
