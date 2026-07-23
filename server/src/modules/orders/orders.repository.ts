import { eq, and, isNull, sql } from 'drizzle-orm';
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

  async findByCreatorId(
    creatorId: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: Order[]; total: number }> {
    const rows = await db.query.orders.findMany({
      where: eq(orders.creatorId, creatorId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      offset,
      limit,
    });
    const total = await db.$count(orders, eq(orders.creatorId, creatorId));
    return { rows, total };
  },

  async findByCustomerEmail(
    email: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: Order[]; total: number }> {
    const normalized = email.trim().toLowerCase();
    const rows = await db.query.orders.findMany({
      where: sql`lower(${orders.customerEmail}) = ${normalized}`,
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { product: true },
      offset,
      limit,
    });
    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`lower(${orders.customerEmail}) = ${normalized}`);
    return { rows, total: totalRows[0]?.count ?? 0 };
  },

  async findByCustomerId(
    customerId: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: Order[]; total: number }> {
    const rows = await db.query.orders.findMany({
      where: eq(orders.customerId, customerId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { product: true },
      offset,
      limit,
    });
    const total = await db.$count(orders, eq(orders.customerId, customerId));
    return { rows, total };
  },

  /**
   * Attach guest checkouts (same email, null customerId) to a customer account.
   */
  async linkGuestOrdersByEmail(email: string, customerId: string): Promise<number> {
    const normalized = email.trim().toLowerCase();
    const result = await db
      .update(orders)
      .set({ customerId, updatedAt: new Date() })
      .where(
        and(
          sql`lower(${orders.customerEmail}) = ${normalized}`,
          isNull(orders.customerId),
        ),
      )
      .returning({ id: orders.id });
    return result.length;
  },

  async markCompleted(
    id: string,
    downloadToken: string,
    downloadTokenExpiresAt: Date,
  ): Promise<void> {
    await db
      .update(orders)
      .set({
        status: 'COMPLETED',
        downloadToken,
        downloadTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  },

  async renewDownloadToken(
    id: string,
    downloadToken: string,
    downloadTokenExpiresAt: Date,
  ): Promise<void> {
    await db
      .update(orders)
      .set({ downloadToken, downloadTokenExpiresAt, updatedAt: new Date() })
      .where(eq(orders.id, id));
  },

  async markFailed(id: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(eq(orders.id, id));
  },
};
