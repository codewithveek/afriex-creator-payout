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
  async listCreatorsWithUser() {
    return db.query.creators.findMany({
      orderBy: desc(creators.createdAt),
      with: { user: true },
    });
  },

  async listRecentWithdrawals(limit = 100) {
    return db.query.withdrawals.findMany({
      orderBy: desc(withdrawals.createdAt),
      limit,
    });
  },

  async listRecentSales(limit = 100) {
    return db.query.sales.findMany({
      orderBy: desc(sales.createdAt),
      limit,
    });
  },

  async listPoolAccounts() {
    return db.query.poolAccounts.findMany({ orderBy: desc(poolAccounts.updatedAt) });
  },
};
