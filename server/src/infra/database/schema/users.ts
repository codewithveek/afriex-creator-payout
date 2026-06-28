import { pgTable, uuid, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userRoleEnum } from './enums';
import { creators } from './creators';

// `users` is the identity table that better-auth manages (sessions, email
// verification, password hashes live in auth-owned tables alongside this).
// `role` gates access at the route/middleware layer (see shared/middleware).
// A CREATOR user has exactly one row in `creators` holding domain-specific
// state (balance, currency). An ADMIN user has no `creators` row — admins are
// platform operators, not earners, so giving them a balance row would be a
// leaky/meaningless concept per Domain-Driven Design bounded-context rules.
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
    // Role is queried on every admin-only route check via middleware.
    index('idx_users_role').on(table.role),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  creator: one(creators, {
    fields: [users.id],
    references: [creators.userId],
  }),
}));
