import { pgTable, uuid, varchar, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// The three tables better-auth owns besides `users`. They were previously
// missing entirely, so the drizzle adapter could not resolve the "session",
// "account" or "verification" models and every sign-up/sign-in returned 500.
//
// Property keys here MUST match better-auth's field names verbatim
// (`expiresAt`, `providerId`, ...) — the adapter indexes the drizzle table
// object by field name. Column names stay snake_case like the rest of the
// schema; drizzle maps between the two.
//
// Ids are `uuid ... defaultRandom()` to match `users.id`. better-auth is told
// to let the database mint them via `advanced.database.generateId: 'uuid'`
// in auth.config.ts — its own id generator emits non-UUID strings, which a
// uuid column rejects.

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Opaque session token carried in the `acp.session_token` cookie. */
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Every authenticated request looks a session up by token, so this index
    // is on the hot path — not just a uniqueness guard.
    uniqueIndex('uq_sessions_token').on(table.token),
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Id of the user at the provider. For email/password this is the user id. */
    accountId: text('account_id').notNull(),
    /** 'credential' for email+password, otherwise the OAuth provider slug. */
    providerId: text('provider_id').notNull(),

    /** Scrypt password hash — only set for the 'credential' provider. */
    password: text('password'),

    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_accounts_user_id').on(table.userId),
    uniqueIndex('uq_accounts_provider_account').on(table.providerId, table.accountId),
  ],
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Email address (verification) or reset-token subject. */
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_verifications_identifier').on(table.identifier),
    index('idx_verifications_expires_at').on(table.expiresAt),
  ],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
