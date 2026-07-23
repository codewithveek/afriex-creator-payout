import { pgTable, uuid, varchar, numeric, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { currencyEnum } from './enums';
import { creators } from './creators';
import { orders } from './orders';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: numeric('price', { precision: 14, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull().default('USD'),

    fileUrl: varchar('file_url', { length: 512 }),
    fileName: varchar('file_name', { length: 255 }),
    fileSize: numeric('file_size', { precision: 14, scale: 0 }),

    published: boolean('published').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_products_creator').on(table.creatorId),
    index('idx_products_published').on(table.published),
    // Public store: published = true ORDER BY created_at DESC
    index('idx_products_published_created').on(table.published, table.createdAt),
    index('idx_products_creator_published').on(table.creatorId, table.published),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  creator: one(creators, {
    fields: [products.creatorId],
    references: [creators.id],
  }),
  orders: many(orders),
}));
