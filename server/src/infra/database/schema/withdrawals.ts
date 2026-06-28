import { pgTable, uuid, varchar, numeric, timestamp, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { withdrawalStatusEnum, withdrawalTriggerEnum, currencyEnum } from './enums';
import { creators } from './creators';
import { payoutMethods } from './payout-methods';
import { poolAccounts } from './pool-accounts';

// One row per disbursement attempt, regardless of what triggered it.
// `trigger` distinguishes ON_DEMAND (creator clicked withdraw) from
// SCHEDULED (weekly/biweekly cron swept this creator's balance) — both feed
// the exact same BullMQ job and worker logic downstream; this column exists
// purely for reporting/audit, not for branching disbursement behavior.
//
// `amount` is snapshotted at creation time from the creator's balance at
// that moment. The balance is decremented immediately on creation (optimistic
// debit) so a creator cannot trigger two overlapping withdrawals against the
// same funds; if Afriex ultimately reports FAILED, the worker credits the
// balance back and that reversal is its own auditable event via
// `failedAt`/`failureReason`, not a silent balance mutation.
export const withdrawals = pgTable(
  'withdrawals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),
    payoutMethodId: uuid('payout_method_id')
      .notNull()
      .references(() => payoutMethods.id, { onDelete: 'restrict' }),
    poolAccountId: uuid('pool_account_id')
      .notNull()
      .references(() => poolAccounts.id, { onDelete: 'restrict' }),

    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull(),

    trigger: withdrawalTriggerEnum('trigger').notNull(),
    status: withdrawalStatusEnum('status').notNull().default('QUEUED'),

    // Set once the worker calls Afriex and gets back a reference.
    afriexTransactionId: varchar('afriex_transaction_id', { length: 255 }),

    failureReason: text('failure_reason'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_withdrawals_creator_created').on(table.creatorId, table.createdAt),
    index('idx_withdrawals_status').on(table.status),
    index('idx_withdrawals_pool_account').on(table.poolAccountId),
    // Reconciling an inbound Afriex webhook looks this up directly.
    index('idx_withdrawals_afriex_transaction').on(table.afriexTransactionId),
  ],
);

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  creator: one(creators, {
    fields: [withdrawals.creatorId],
    references: [creators.id],
  }),
  payoutMethod: one(payoutMethods, {
    fields: [withdrawals.payoutMethodId],
    references: [payoutMethods.id],
  }),
  poolAccount: one(poolAccounts, {
    fields: [withdrawals.poolAccountId],
    references: [poolAccounts.id],
  }),
}));
