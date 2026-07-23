import { pgTable, uuid, numeric, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { currencyEnum } from './enums';
import { creators } from './creators';

/**
 * Per-currency available balance for a creator.
 * Sales credit the sale currency; withdrawals debit the withdrawal currency.
 * This prevents NGN earnings from being withdrawn as USD (or vice versa).
 *
 * `creators.availableBalance` is kept as a denormalized mirror of the
 * creator's `payoutCurrency` balance for backward-compatible API consumers.
 */
export const creatorBalances = pgTable(
  'creator_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    currency: currencyEnum('currency').notNull(),
    availableBalance: numeric('available_balance', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_creator_balances_creator_currency').on(table.creatorId, table.currency),
    index('idx_creator_balances_positive').on(table.creatorId, table.availableBalance),
  ],
);

export const creatorBalancesRelations = relations(creatorBalances, ({ one }) => ({
  creator: one(creators, {
    fields: [creatorBalances.creatorId],
    references: [creators.id],
  }),
}));
