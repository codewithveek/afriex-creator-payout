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
  FRONTEND_URL: z.string().url().optional(),

  // Default collector when the buyer does not pick one.
  // Buyers primarily select Paystack or Flutterwave at checkout.
  // Afriex is used only for creator payouts (disbursement), not collection.
  PAYMENT_PROVIDER: z.enum(['stripe', 'paystack', 'flutterwave', 'afriex-checkout']).default('paystack'),

  // Stripe keys — required only when PAYMENT_PROVIDER === 'stripe'
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Paystack keys — required only when PAYMENT_PROVIDER === 'paystack'
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),

  // Flutterwave keys — required only when PAYMENT_PROVIDER === 'flutterwave'
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),

  // Cloudflare R2 (for file uploads via FluxMedia)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional().default('afriex-creator-files'),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Afriex — always required for disbursement, also reused by afriex-checkout provider
  AFRIEX_API_KEY: z.string().min(1),
  AFRIEX_ENVIRONMENT: z.enum(['staging', 'production']).optional().default('staging'),
  AFRIEX_WEBHOOK_PUBLIC_KEY: z.string().min(1),

  /** AES-256 key (base64, 32 bytes) for bank secrets and default PII encryption. */
  PAYOUT_SECRETS_ENCRYPTION_KEY: z.string().min(1),
  /** Optional separate AES key for PII; defaults to PAYOUT_SECRETS_ENCRYPTION_KEY. */
  PII_ENCRYPTION_KEY: z.string().optional(),
  /** Optional HMAC key (base64, ≥32 bytes) for blind indexes; derived if omitted. */
  BLIND_INDEX_KEY: z.string().optional(),

  /** Public site URL used for redirect allowlisting (often same as FRONTEND_URL). */
  SITE_URL: z.string().url().optional(),
  /** Comma-separated extra origins allowed for file download redirects. */
  ALLOWED_STORAGE_ORIGINS: z.string().optional(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  WITHDRAWAL_MIN_AMOUNT_MINOR: z.coerce.number().int().positive().default(500),
  WITHDRAWAL_COOLDOWN_HOURS: z.coerce.number().int().positive().default(24),
  SCHEDULED_DISBURSEMENT_CADENCE: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),

  // Percentage of gross sale amount retained as platform fee. Stored on
  // every earnings row at the rate in effect when the sale was processed —
  // see infra/database/schema/earnings.ts for why this matters.
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(10),

  /** How long a purchase download token remains valid (days). Default 7. */
  DOWNLOAD_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
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
