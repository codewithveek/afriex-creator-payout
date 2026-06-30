import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { sales } from '../../infra/database/schema';

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export const salesRepository = {
  async findByPaymentIntentId(paymentIntentId: string): Promise<Sale | undefined> {
    return db.query.sales.findFirst({
      where: eq(sales.paymentIntentId, paymentIntentId),
    });
  },

  async create(input: NewSale): Promise<Sale> {
    const [row] = await db.insert(sales).values(input).returning();
    return row!;
  },

  async markRefunded(saleId: string): Promise<void> {
    await db.update(sales).set({ status: 'REFUNDED', updatedAt: new Date() }).where(eq(sales.id, saleId));
  },

  async findByCreatorId(creatorId: string, offset: number, limit: number): Promise<{ rows: Sale[]; total: number }> {
    const rows = await db.query.sales.findMany({
      where: eq(sales.creatorId, creatorId),
      offset,
      limit,
    });
    const total = await db.$count(sales, eq(sales.creatorId, creatorId));
    return { rows, total };
  },
};
