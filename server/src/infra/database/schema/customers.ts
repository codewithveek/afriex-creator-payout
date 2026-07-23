import { pgTable, uuid, varchar, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';

// Buyer accounts. Email and name are encrypted at rest (enc:v1:...).
// Lookups use emailHash (HMAC blind index), which is unique + indexed.
// Session tokens are stored only as SHA-256 hashes (sessionTokenHash).
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** AES-GCM packed ciphertext of normalized email (or legacy plaintext until re-encrypted). */
    email: text('email').notNull(),
    /** HMAC-SHA256 hex blind index of normalized email — equality search only. */
    emailHash: varchar('email_hash', { length: 64 }).notNull(),

    /** Encrypted display name. */
    name: text('name').notNull(),

    passwordHash: varchar('password_hash', { length: 255 }),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),

    /** SHA-256 of the bearer session token (never store raw token). */
    sessionTokenHash: varchar('session_token_hash', { length: 64 }),
    sessionExpiresAt: timestamp('session_expires_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_customers_email_hash').on(table.emailHash),
    index('idx_customers_session_token_hash').on(table.sessionTokenHash),
  ],
);

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));
