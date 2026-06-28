import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { sales } from '../../infra/database/schema';

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export const salesRepository = {
  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Sale | undefined> {
    return db.query.sales.findFirst({
      where: eq(sales.stripePaymentIntentId, stripePaymentIntentId),
    });
  },

  async create(input: NewSale): Promise<Sale> {
    const [row] = await db.insert(sales).values(input).returning();
    return row!;
  },

  async markRefunded(saleId: string): Promise<void> {
    await db.update(sales).set({ status: 'REFUNDED', updatedAt: new Date() }).where(eq(sales.id, saleId));
  },

  async findByCreatorId(creatorId: string): Promise<Sale[]> {
    return db.query.sales.findMany({ where: eq(sales.creatorId, creatorId) });
  },
};
