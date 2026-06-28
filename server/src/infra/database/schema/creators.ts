import { pgTable, uuid, numeric, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { currencyEnum } from './enums';
import { users } from './users';
import { payoutMethods } from './payout-methods';
import { sales } from './sales';
import { earnings } from './earnings';
import { withdrawals } from './withdrawals';

// One row per creator user. `availableBalance` is the locked-in model: a
// running counter incremented by confirmed earnings and decremented by
// queued/paid withdrawals. It is NOT derived by summing earnings on every
// read — that would not scale once a creator has thousands of sales, and the
// counter is authoritative by design (earnings rows are historical record
// only, per the explicit decision not to trace withdrawals back to specific
// earnings).
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

    // Money is stored as NUMERIC, not FLOAT — exact decimal arithmetic is
    // mandatory for any balance. Precision 14, scale 2 supports balances up
    // to ~999 billion units of the minor currency, which is more than ample
    // headroom and avoids ever having to widen this column.
    availableBalance: numeric('available_balance', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    payoutCurrency: currencyEnum('payout_currency').notNull().default('USD'),

    payoutEligible: boolean('payout_eligible').notNull().default(false),

    // Cooldown enforcement for on-demand withdrawals reads this column
    // directly rather than querying the withdrawals table on every request.
    lastWithdrawalAt: timestamp('last_withdrawal_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // The scheduled sweep query is: WHERE payout_eligible = true AND
    // available_balance > 0. Composite index on (payout_eligible, currency)
    // supports filtering eligible creators grouped by which pool account
    // they draw from, satisfying the Equality->Sort->Range index pattern
    // (equality on both columns, the balance > 0 range scan benefits from
    // the resulting narrow row set rather than needing its own index).
    index('idx_creators_eligible_currency').on(table.payoutEligible, table.payoutCurrency),
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
