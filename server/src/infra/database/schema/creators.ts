import { pgTable, uuid, varchar, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { currencyEnum } from './enums';
import { users } from './users';
import { payoutMethods } from './payout-methods';
import { sales } from './sales';
import { earnings } from './earnings';
import { withdrawals } from './withdrawals';

// One row per creator user.
//
// Multi-currency balances live in `creator_balances` — that table is the
// single source of truth for balance. There is deliberately no denormalized
// balance mirror on this table; a mirror that isn't written inside the same
// transaction as the ledger it mirrors will drift, and API responses that
// need a creator's payout-currency balance (creatorsService.getProfileWithBalances)
// read it from `creator_balances` directly instead.
// Always credit/debit via creatorsRepository.incrementBalance /
// decrementBalance with an explicit currency.
//
// `payoutEligible` is a denormalized flag set true only when the creator has
// at least one VERIFIED payout method. The scheduled disbursement sweep
// filters on this column directly rather than joining payout_methods on
// every run, since that query executes for the whole creator base on a cron.
export const creators = pgTable(
  'creators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Encrypted phone (enc:v1:...) or legacy plaintext. */
    phone: text('phone').notNull().default(''),
    /** HMAC blind index of normalized phone for optional lookup. */
    phoneHash: varchar('phone_hash', { length: 64 }),
    country: varchar('country', { length: 2 }).notNull().default('NG'),

    payoutCurrency: currencyEnum('payout_currency').notNull().default('USD'),

    payoutEligible: boolean('payout_eligible').notNull().default(false),

    // Cooldown enforcement for on-demand withdrawals reads this column
    // directly rather than querying the withdrawals table on every request.
    lastWithdrawalAt: timestamp('last_withdrawal_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // The scheduled sweep query is: WHERE payout_eligible = true, joined to
    // creator_balances on (creator_id, currency = payout_currency) with
    // available_balance > 0. Composite index on (payout_eligible, currency)
    // supports filtering eligible creators grouped by which pool account
    // they draw from, satisfying the Equality->Sort->Range index pattern.
    index('idx_creators_eligible_currency').on(table.payoutEligible, table.payoutCurrency),
    index('idx_creators_phone_hash').on(table.phoneHash),
    index('idx_creators_user_id').on(table.userId),
  ],
);

export const creatorsRelations = relations(creators, ({ one, many }) => ({
  user: one(users, {
    fields: [creators.userId],
    references: [users.id],
  }),
  payoutMethods: many(payoutMethods),
  sales: many(sales),
  earnings: many(earnings),
  withdrawals: many(withdrawals),
}));
