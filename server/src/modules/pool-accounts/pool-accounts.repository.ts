import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { poolAccounts } from '../../infra/database/schema';

export type PoolAccount = typeof poolAccounts.$inferSelect;

export const poolAccountsRepository = {
  async findByCurrency(currency: string): Promise<PoolAccount | undefined> {
    return db.query.poolAccounts.findFirst({ where: eq(poolAccounts.currency, currency as PoolAccount['currency']) });
  },

  async findById(id: string): Promise<PoolAccount | undefined> {
    return db.query.poolAccounts.findFirst({ where: eq(poolAccounts.id, id) });
  },

  /** Credits the pool account when a sale settles into it. */
  async incrementBalance(poolAccountId: string, amount: string): Promise<void> {
    await db
      .update(poolAccounts)
      .set({ balance: sql`${poolAccounts.balance} + ${amount}::numeric`, updatedAt: new Date() })
      .where(eq(poolAccounts.id, poolAccountId));
  },

  /** Debits the pool account when a withdrawal disburses out of it. */
  async decrementBalance(poolAccountId: string, amount: string): Promise<void> {
    await db
      .update(poolAccounts)
      .set({ balance: sql`${poolAccounts.balance} - ${amount}::numeric`, updatedAt: new Date() })
      .where(eq(poolAccounts.id, poolAccountId));
  },
};
