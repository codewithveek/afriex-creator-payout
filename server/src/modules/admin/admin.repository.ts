import { desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { creators, withdrawals, sales, poolAccounts } from '../../infra/database/schema';

// Per the architecture guide's layering rule, a controller never touches
// the database directly. The admin module's reads span multiple domains
// (creators, withdrawals, sales, pool accounts) by nature of being an
// oversight dashboard, so this repository is intentionally cross-cutting —
// it is the one exception the guide allows implicitly: a reporting/admin
// layer that reads across bounded contexts for display purposes only,
// never writing into another domain's tables.
export const adminRepository = {
  async listCreatorsWithUser(offset: number, limit: number) {
    const rows = await db.query.creators.findMany({
      orderBy: desc(creators.createdAt),
      with: { user: true },
      offset,
      limit,
    });
    const total = await db.$count(creators);
    return { rows, total };
  },

  async listRecentWithdrawals(offset: number, limit: number) {
    const rows = await db.query.withdrawals.findMany({
      orderBy: desc(withdrawals.createdAt),
      offset,
      limit,
    });
    const total = await db.$count(withdrawals);
    return { rows, total };
  },

  async listRecentSales(offset: number, limit: number) {
    const rows = await db.query.sales.findMany({
      orderBy: desc(sales.createdAt),
      offset,
      limit,
    });
    const total = await db.$count(sales);
    return { rows, total };
  },

  async listPoolAccounts(offset: number, limit: number) {
    const rows = await db.query.poolAccounts.findMany({ orderBy: desc(poolAccounts.updatedAt), offset, limit });
    const total = await db.$count(poolAccounts);
    return { rows, total };
  },
};
