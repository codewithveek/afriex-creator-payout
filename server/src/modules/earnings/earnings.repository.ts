import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { earnings } from '../../infra/database/schema';

export type Earning = typeof earnings.$inferSelect;
export type NewEarning = typeof earnings.$inferInsert;

export const earningsRepository = {
  async create(input: NewEarning): Promise<Earning> {
    const [row] = await db.insert(earnings).values(input).returning();
    return row!;
  },

  async findBySaleId(saleId: string): Promise<Earning | undefined> {
    return db.query.earnings.findFirst({ where: eq(earnings.saleId, saleId) });
  },

  async findByCreatorId(creatorId: string): Promise<Earning[]> {
    return db.query.earnings.findMany({
      where: eq(earnings.creatorId, creatorId),
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  },

  async markReversed(earningId: string): Promise<void> {
    await db
      .update(earnings)
      .set({ status: 'REVERSED', reversedAt: new Date() })
      .where(eq(earnings.id, earningId));
  },
};
