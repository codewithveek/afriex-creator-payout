import { pgTable, uuid, varchar, numeric, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { saleStatusEnum, currencyEnum } from './enums';
import { creators } from './creators';
import { earnings } from './earnings';

// One row per buyer purchase, created when the Stripe webhook fires. This is
// the entry point of the whole earnings pipeline: Sale -> Earning ->
// (eventually) Withdrawal.
//
// `grossAmount` is what the buyer paid — that's all a sale records about
// money. The fee breakdown (platformFeePercent, platformFeeAmount, net
// amount) lives exclusively on the `earnings` row produced from this sale,
// not duplicated here. Storing it in both places would create two sources
// of truth for the same fee math with no way to know which one is
// authoritative if they ever disagreed — a sale either has been processed
// into an earning (and the earning has the breakdown) or it hasn't yet.
export const sales = pgTable(
  'sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),

    // Idempotency key from Stripe (the PaymentIntent or Charge ID). UNIQUE
    // is what makes the webhook handler safely retryable — Stripe redelivers
    // webhooks on timeout, and without this constraint a retried webhook
    // would double-count the sale.
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).notNull(),

    grossAmount: numeric('gross_amount', { precision: 14, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull(),

    status: saleStatusEnum('status').notNull().default('PENDING'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_sales_stripe_payment_intent').on(table.stripePaymentIntentId),
    // Creator's sales history view: equality on creator, sorted by recency.
    index('idx_sales_creator_created').on(table.creatorId, table.createdAt),
    index('idx_sales_status').on(table.status),
  ],
);

export const salesRelations = relations(sales, ({ one, many }) => ({
  creator: one(creators, {
    fields: [sales.creatorId],
    references: [creators.id],
  }),
  earnings: many(earnings),
}));
