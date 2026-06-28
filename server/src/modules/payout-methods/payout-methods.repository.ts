import { eq, and } from 'drizzle-orm';
import { db } from '../../config/db';
import { payoutMethods } from '../../infra/database/schema';

export type PayoutMethod = typeof payoutMethods.$inferSelect;
export type NewPayoutMethod = typeof payoutMethods.$inferInsert;

export const payoutMethodsRepository = {
  async create(input: NewPayoutMethod): Promise<PayoutMethod> {
    const [row] = await db.insert(payoutMethods).values(input).returning();
    return row!;
  },

  async findById(id: string): Promise<PayoutMethod | undefined> {
    return db.query.payoutMethods.findFirst({ where: eq(payoutMethods.id, id) });
  },

  async findByCreatorId(creatorId: string): Promise<PayoutMethod[]> {
    return db.query.payoutMethods.findMany({ where: eq(payoutMethods.creatorId, creatorId) });
  },

  async findVerifiedByCreatorId(creatorId: string): Promise<PayoutMethod | undefined> {
    return db.query.payoutMethods.findFirst({
      where: and(eq(payoutMethods.creatorId, creatorId), eq(payoutMethods.status, 'VERIFIED')),
    });
  },

  async markVerified(id: string): Promise<void> {
    await db
      .update(payoutMethods)
      .set({ status: 'VERIFIED', updatedAt: new Date() })
      .where(eq(payoutMethods.id, id));
  },

  async markRevoked(id: string): Promise<void> {
    await db
      .update(payoutMethods)
      .set({ status: 'REVOKED', revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(payoutMethods.id, id));
  },
};
