import { pgTable, uuid, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userRoleEnum } from './enums';
import { creators } from './creators';

// `users` is the identity table that better-auth manages (sessions, email
// verification, password hashes live in auth-owned tables alongside this).
//
// Email stays plaintext here by design: better-auth requires a stable email
// identifier for login, verification, and unique constraints. Buyer/order
// PII and creator phones are encrypted in their own tables with blind indexes.
//
// `role` gates access at the route/middleware layer (see shared/middleware).
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 150 }).notNull(),
    role: userRoleEnum('role').notNull().default('CREATOR'),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_users_role').on(table.role),
    // better-auth already uniques email; composite helps role+email admin filters
    index('idx_users_role_email').on(table.role, table.email),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  creator: one(creators, {
    fields: [users.id],
    references: [creators.userId],
  }),
}));
