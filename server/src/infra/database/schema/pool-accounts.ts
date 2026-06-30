import { pgTable, uuid, varchar, numeric, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { currencyEnum } from './enums';
import { withdrawals } from './withdrawals';

// One row per currency, per the locked decision: "one pool account per
// currency". This is the real source of outbound creator disbursements —
// payment providers settle buyer payments here (conceptually; the actual
// settlement rail is provider -> bank -> Afriex top-up, modeled here as a
// balance, not a literal real-time wire), and the disbursement worker draws
// down from `balance` when paying a creator in that currency.
//
// `currency` has a UNIQUE constraint, not just an index — there must never
// be two pool accounts for the same currency, or the worker would not know
// which one to debit.
export const poolAccounts = pgTable(
  'pool_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    currency: currencyEnum('currency').notNull(),

    // The Afriex-side virtual/pool account identifier this row mirrors.
    afriexAccountId: varchar('afriex_account_id', { length: 255 }).notNull(),

    balance: numeric('balance', { precision: 14, scale: 2 }).notNull().default('0.00'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('uq_pool_accounts_currency').on(table.currency)],
);

export const poolAccountsRelations = relations(poolAccounts, ({ many }) => ({
  withdrawals: many(withdrawals),
}));
