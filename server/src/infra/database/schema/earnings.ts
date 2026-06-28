import { pgTable, uuid, numeric, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { earningStatusEnum, currencyEnum } from './enums';
import { creators } from './creators';
import { sales } from './sales';

// One row per sale that has been processed into a creator's balance.
// Per the explicitly locked decision: these rows are HISTORICAL RECORD ONLY.
// They are not linked to withdrawals, and a withdrawal does not "consume"
// specific earnings rows. `creators.available_balance` is the sole
// authoritative running counter; this table exists purely so a creator (and
// admin) can see an itemized accrual history and so refunds have something
// concrete to reverse.
//
// `platformFeePercent` is stored on every row (not just feeAmount/netAmount)
// because the fee rate is a configuration value that can change over time —
// recording the rate in effect at the time of each sale keeps historical
// earnings accurate even after the platform-wide fee changes later. Never
// derive the fee from gross minus net at query time; all three amounts are
// written explicitly at processing time and never recomputed.
export const earnings = pgTable(
  'earnings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'restrict' }),

    grossAmount: numeric('gross_amount', { precision: 14, scale: 2 }).notNull(),
    platformFeePercent: numeric('platform_fee_percent', { precision: 5, scale: 2 }).notNull(),
    platformFeeAmount: numeric('platform_fee_amount', { precision: 14, scale: 2 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(), // net amount credited to balance
    currency: currencyEnum('currency').notNull(),

    status: earningStatusEnum('status').notNull().default('CONFIRMED'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Set only when status transitions to REVERSED (a refund on the
    // underlying sale).
    reversedAt: timestamp('reversed_at', { withTimezone: true }),
  },
  (table) => [
    // Creator's earnings history view, most recent first.
    index('idx_earnings_creator_created').on(table.creatorId, table.createdAt),
    // One earning per sale, enforced at the DB level. This is what makes
    // EarningsService.processSale() truly idempotent — a webhook retried
    // after a network timeout can safely attempt to insert again; the
    // unique violation is the actual guard, not just an application-level
    // status check that could race under concurrent delivery.
    uniqueIndex('uq_earnings_sale').on(table.saleId),
  ],
);

export const earningsRelations = relations(earnings, ({ one }) => ({
  creator: one(creators, {
    fields: [earnings.creatorId],
    references: [creators.id],
  }),
  sale: one(sales, {
    fields: [earnings.saleId],
    references: [sales.id],
  }),
}));
