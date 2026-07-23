import { pgTable, uuid, varchar, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderStatusEnum, currencyEnum } from './enums';
import { products } from './products';
import { customers } from './customers';
import { creators } from './creators';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    /** Encrypted buyer email (or legacy plaintext). */
    customerEmail: text('customer_email').notNull(),
    /** Blind index for guest-order linking and lookup. */
    customerEmailHash: varchar('customer_email_hash', { length: 64 }).notNull().default(''),
    /** Encrypted buyer name. */
    customerName: text('customer_name').notNull(),

    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull(),

    status: orderStatusEnum('status').notNull().default('PENDING'),

    paymentSessionId: varchar('payment_session_id', { length: 255 }).notNull().unique(),

    /** Encrypted raw download token (enc:v1:...). Presented only to authorized buyers. */
    downloadTokenEncrypted: text('download_token_encrypted'),
    /** SHA-256 of raw token for constant-time verification without decrypt. */
    downloadTokenHash: varchar('download_token_hash', { length: 64 }),
    downloadTokenExpiresAt: timestamp('download_token_expires_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_orders_customer_email_hash').on(table.customerEmailHash),
    index('idx_orders_customer_id').on(table.customerId),
    index('idx_orders_creator').on(table.creatorId),
    index('idx_orders_product').on(table.productId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_download_token_hash').on(table.downloadTokenHash),
    index('idx_orders_creator_status_created').on(table.creatorId, table.status, table.createdAt),
  ],
);

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  creator: one(creators, {
    fields: [orders.creatorId],
    references: [creators.id],
  }),
}));
