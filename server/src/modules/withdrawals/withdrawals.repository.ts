import { eq, and } from 'drizzle-orm';
import { db, type Executor } from '../../config/db';
import { withdrawals } from '../../infra/database/schema';

export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;

export const withdrawalsRepository = {
  async create(input: NewWithdrawal, executor: Executor = db): Promise<Withdrawal> {
    const [row] = await executor.insert(withdrawals).values(input).returning();
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

  /**
   * Records the Afriex transaction id and, if the row is still QUEUED,
   * advances it to PROCESSING. The status transition is conditional because
   * the webhook can resolve this withdrawal to PAID/FAILED before this call
   * lands (it now looks the withdrawal up by idempotency key, which exists
   * before the transfer is even created — see afriex-webhook.router.ts) —
   * unconditionally overwriting status here would clobber that outcome.
   */
  async markProcessing(id: string, afriexTransactionId: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({ afriexTransactionId, processedAt: new Date() })
      .where(eq(withdrawals.id, id));

    await db
      .update(withdrawals)
      .set({ status: 'PROCESSING' })
      .where(and(eq(withdrawals.id, id), eq(withdrawals.status, 'QUEUED')));
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

  /**
   * The Afriex call errored in a way that does not prove the transfer never
   * happened (timeout, 5xx, socket error). Unlike markFailed, this does NOT
   * imply the balance should be credited back — the money may have already
   * moved. UNKNOWN withdrawals need manual reconciliation against Afriex by
   * their idempotency key (the withdrawal id) before any balance mutation.
   */
  async markUnknown(id: string, failureReason: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({ status: 'UNKNOWN', failureReason })
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
