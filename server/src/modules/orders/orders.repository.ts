import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { orders } from '../../infra/database/schema';

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const ordersRepository = {
  async create(input: NewOrder): Promise<Order> {
    const [row] = await db.insert(orders).values(input).returning();
    return row!;
  },

  async findById(id: string): Promise<Order | undefined> {
    return db.query.orders.findFirst({ where: eq(orders.id, id) });
  },

  async findByPaymentSessionId(sessionId: string): Promise<Order | undefined> {
    return db.query.orders.findFirst({ where: eq(orders.paymentSessionId, sessionId) });
  },

  async findByCreatorId(creatorId: string): Promise<Order[]> {
    return db.query.orders.findMany({
      where: eq(orders.creatorId, creatorId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
  },

  async findByCustomerEmail(email: string): Promise<Order[]> {
    return db.query.orders.findMany({
      where: eq(orders.customerEmail, email),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { product: true },
    });
  },

  async markCompleted(id: string, downloadToken: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: 'COMPLETED', downloadToken, updatedAt: new Date() })
      .where(eq(orders.id, id));
  },

  async markFailed(id: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(eq(orders.id, id));
  },
};
