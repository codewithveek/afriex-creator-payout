import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';
import * as schema from '../infra/database/schema';

// Single shared connection pool for the process. Every repository imports
// `db` from here — repositories never instantiate their own client, which
// would defeat connection pooling and make testing harder.
const queryClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 20 : 5,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
