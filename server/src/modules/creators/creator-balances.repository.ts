import { eq, and, sql, gt, gte } from 'drizzle-orm';
import { db, type Executor } from '../../config/db';
import { creatorBalances } from '../../infra/database/schema';

export type CreatorBalance = typeof creatorBalances.$inferSelect;
export type CurrencyCode = 'USD' | 'NGN' | 'GHS' | 'KES';

export const creatorBalancesRepository = {
  async listForCreator(creatorId: string): Promise<CreatorBalance[]> {
    return db.query.creatorBalances.findMany({
      where: eq(creatorBalances.creatorId, creatorId),
      orderBy: (b, { asc }) => [asc(b.currency)],
    });
  },

  async getBalance(creatorId: string, currency: CurrencyCode, executor: Executor = db): Promise<string> {
    const row = await executor.query.creatorBalances.findFirst({
      where: and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)),
    });
    return row?.availableBalance ?? '0.00';
  },

  async ensureRow(creatorId: string, currency: CurrencyCode, executor: Executor = db): Promise<CreatorBalance> {
    const existing = await executor.query.creatorBalances.findFirst({
      where: and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)),
    });
    if (existing) return existing;

    const [row] = await executor
      .insert(creatorBalances)
      .values({ creatorId, currency, availableBalance: '0.00' })
      .onConflictDoNothing()
      .returning();

    if (row) return row;

    const again = await executor.query.creatorBalances.findFirst({
      where: and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)),
    });
    return again!;
  },

  /** Atomically credits a currency balance. */
  async increment(creatorId: string, currency: CurrencyCode, amount: string, executor: Executor = db): Promise<void> {
    await this.ensureRow(creatorId, currency, executor);

    await executor
      .update(creatorBalances)
      .set({
        availableBalance: sql`${creatorBalances.availableBalance} + ${amount}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)));
  },

  /**
   * Atomically debits a currency balance, but only if sufficient funds are
   * available. The `available_balance >= amount` guard runs inside the same
   * UPDATE as the debit, so two concurrent debits can never both succeed
   * against the same funds — the loser's WHERE clause simply matches zero
   * rows. Returns false (and leaves the balance untouched) when funds are
   * insufficient, instead of relying on a separate read-then-write check.
   */
  async decrement(creatorId: string, currency: CurrencyCode, amount: string, executor: Executor = db): Promise<boolean> {
    await this.ensureRow(creatorId, currency, executor);

    const updated = await executor
      .update(creatorBalances)
      .set({
        availableBalance: sql`${creatorBalances.availableBalance} - ${amount}::numeric`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(creatorBalances.creatorId, creatorId),
          eq(creatorBalances.currency, currency),
          gte(creatorBalances.availableBalance, sql`${amount}::numeric`),
        ),
      )
      .returning({ id: creatorBalances.id });

    return updated.length > 0;
  },

  /** Creators with a positive balance in a given currency (for scheduled sweeps). */
  async findPositiveInCurrency(currency: CurrencyCode): Promise<CreatorBalance[]> {
    return db.query.creatorBalances.findMany({
      where: and(eq(creatorBalances.currency, currency), gt(creatorBalances.availableBalance, '0')),
    });
  },
};
