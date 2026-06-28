import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { creators } from '../../infra/database/schema';

export type Creator = typeof creators.$inferSelect;

// Repository: DB access only. Returns domain rows directly here since
// drizzle's inferred select type already IS the domain shape (no ORM-leak
// risk the way a raw query builder result might leak driver-specific types).
export const creatorsRepository = {
  async findById(creatorId: string): Promise<Creator | undefined> {
    return db.query.creators.findFirst({ where: eq(creators.id, creatorId) });
  },

  async findByUserId(userId: string): Promise<Creator | undefined> {
    return db.query.creators.findFirst({ where: eq(creators.userId, userId) });
  },

  async create(userId: string): Promise<Creator> {
    const [row] = await db.insert(creators).values({ userId }).returning();
    return row!;
  },

  /**
   * Adds `amount` to the creator's available balance, atomically at the DB
   * level via raw SQL arithmetic. This avoids a read-modify-write race: two
   * concurrent earnings (or a withdrawal racing an earning) must never
   * clobber each other by both reading the same stale balance.
   */
  async incrementBalance(creatorId: string, amount: string): Promise<void> {
    await db
      .update(creators)
      .set({
        availableBalance: sql`${creators.availableBalance} + ${amount}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));
  },

  /**
   * Subtracts `amount` from the creator's available balance. Used when a
   * withdrawal is created (optimistic debit) and is NOT guarded here against
   * going negative — the service layer must check sufficiency before
   * calling this, since the repository's job is DB access only, not
   * business rules.
   */
  async decrementBalance(creatorId: string, amount: string): Promise<void> {
    await db
      .update(creators)
      .set({
        availableBalance: sql`${creators.availableBalance} - ${amount}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));
  },

  /** Sets payoutEligible based on whether the creator has any VERIFIED payout method. */
  async setPayoutEligible(creatorId: string, eligible: boolean): Promise<void> {
    await db
      .update(creators)
      .set({ payoutEligible: eligible, updatedAt: new Date() })
      .where(eq(creators.id, creatorId));
  },

  async setLastWithdrawalAt(creatorId: string, when: Date): Promise<void> {
    await db
      .update(creators)
      .set({ lastWithdrawalAt: when, updatedAt: new Date() })
      .where(eq(creators.id, creatorId));
  },

  /** Creators eligible for the scheduled disbursement sweep: payout-eligible with a positive balance. */
  async findEligibleForScheduledSweep(): Promise<Creator[]> {
    return db.query.creators.findMany({
      where: and(eq(creators.payoutEligible, true), gt(creators.availableBalance, '0')),
    });
  },
};
