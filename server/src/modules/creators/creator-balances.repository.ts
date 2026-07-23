import { eq, and, sql, gt } from 'drizzle-orm';
import { db } from '../../config/db';
import { creatorBalances, creators } from '../../infra/database/schema';

export type CreatorBalance = typeof creatorBalances.$inferSelect;
export type CurrencyCode = 'USD' | 'NGN' | 'GHS' | 'KES';

export const creatorBalancesRepository = {
  async listForCreator(creatorId: string): Promise<CreatorBalance[]> {
    return db.query.creatorBalances.findMany({
      where: eq(creatorBalances.creatorId, creatorId),
      orderBy: (b, { asc }) => [asc(b.currency)],
    });
  },

  async getBalance(creatorId: string, currency: CurrencyCode): Promise<string> {
    const row = await db.query.creatorBalances.findFirst({
      where: and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)),
    });
    return row?.availableBalance ?? '0.00';
  },

  async ensureRow(creatorId: string, currency: CurrencyCode): Promise<CreatorBalance> {
    const existing = await db.query.creatorBalances.findFirst({
      where: and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)),
    });
    if (existing) return existing;

    const [row] = await db
      .insert(creatorBalances)
      .values({ creatorId, currency, availableBalance: '0.00' })
      .onConflictDoNothing()
      .returning();

    if (row) return row;

    const again = await db.query.creatorBalances.findFirst({
      where: and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)),
    });
    return again!;
  },

  /**
   * Atomically credits a currency balance. Also mirrors into
   * `creators.availableBalance` when the currency is the creator's payout currency.
   */
  async increment(creatorId: string, currency: CurrencyCode, amount: string): Promise<void> {
    await this.ensureRow(creatorId, currency);

    await db
      .update(creatorBalances)
      .set({
        availableBalance: sql`${creatorBalances.availableBalance} + ${amount}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)));

    await this.syncLegacyMirror(creatorId, currency);
  },

  async decrement(creatorId: string, currency: CurrencyCode, amount: string): Promise<void> {
    await this.ensureRow(creatorId, currency);

    await db
      .update(creatorBalances)
      .set({
        availableBalance: sql`${creatorBalances.availableBalance} - ${amount}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(creatorBalances.creatorId, creatorId), eq(creatorBalances.currency, currency)));

    await this.syncLegacyMirror(creatorId, currency);
  },

  /** Keep creators.availableBalance equal to the payoutCurrency ledger row. */
  async syncLegacyMirror(creatorId: string, touchedCurrency: CurrencyCode): Promise<void> {
    const creator = await db.query.creators.findFirst({ where: eq(creators.id, creatorId) });
    if (!creator) return;
    if (creator.payoutCurrency !== touchedCurrency) return;

    const balance = await this.getBalance(creatorId, touchedCurrency);
    await db
      .update(creators)
      .set({ availableBalance: balance, updatedAt: new Date() })
      .where(eq(creators.id, creatorId));
  },

  /** Creators with a positive balance in a given currency (for scheduled sweeps). */
  async findPositiveInCurrency(currency: CurrencyCode): Promise<CreatorBalance[]> {
    return db.query.creatorBalances.findMany({
      where: and(eq(creatorBalances.currency, currency), gt(creatorBalances.availableBalance, '0')),
    });
  },
};
