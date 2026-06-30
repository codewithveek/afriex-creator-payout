import { pgTable, uuid, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core';
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
    customerId: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'set null' }),

    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),

    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull(),

    status: orderStatusEnum('status').notNull().default('PENDING'),

    stripeSessionId: varchar('stripe_session_id', { length: 255 }).notNull().unique(),
    downloadToken: varchar('download_token', { length: 64 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_orders_customer_email').on(table.customerEmail),
    index('idx_orders_creator').on(table.creatorId),
    index('idx_orders_product').on(table.productId),
    index('idx_orders_status').on(table.status),
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
