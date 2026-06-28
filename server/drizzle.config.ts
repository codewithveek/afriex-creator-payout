import type { Config } from 'drizzle-kit';

export default {
  schema: './src/infra/database/schema',
  out: './src/infra/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
