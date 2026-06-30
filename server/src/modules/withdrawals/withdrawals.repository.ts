import { eq, and } from 'drizzle-orm';
import { db } from '../../config/db';
import { withdrawals } from '../../infra/database/schema';

export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;

export const withdrawalsRepository = {
  async create(input: NewWithdrawal): Promise<Withdrawal> {
    const [row] = await db.insert(withdrawals).values(input).returning();
    return row!;
  },

  async findById(id: string): Promise<Withdrawal | undefined> {
    return db.query.withdrawals.findFirst({ where: eq(withdrawals.id, id) });
  },

  async findByCreatorId(creatorId: string, offset: number, limit: number): Promise<{ rows: Withdrawal[]; total: number }> {
    const rows = await db.query.withdrawals.findMany({
      where: eq(withdrawals.creatorId, creatorId),
      orderBy: (table, { desc }) => desc(table.createdAt),
      offset,
      limit,
    });
    const total = await db.$count(withdrawals, eq(withdrawals.creatorId, creatorId));
    return { rows, total };
  },

  async findByAfriexTransactionId(afriexTransactionId: string): Promise<Withdrawal | undefined> {
    return db.query.withdrawals.findFirst({
      where: eq(withdrawals.afriexTransactionId, afriexTransactionId),
    });
  },

  async markProcessing(id: string, afriexTransactionId: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({ status: 'PROCESSING', afriexTransactionId, processedAt: new Date() })
      .where(eq(withdrawals.id, id));
  },

  async markPaid(id: string): Promise<void> {
    await db.update(withdrawals).set({ status: 'PAID', paidAt: new Date() }).where(eq(withdrawals.id, id));
  },

  async markFailed(id: string, failureReason: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({ status: 'FAILED', failureReason, failedAt: new Date() })
      .where(eq(withdrawals.id, id));
  },

  /** Used by the on-demand withdrawal cooldown check, scoped to a single creator. */
  async findMostRecentForCreator(creatorId: string): Promise<Withdrawal | undefined> {
    return db.query.withdrawals.findFirst({
      where: eq(withdrawals.creatorId, creatorId),
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  },
};
