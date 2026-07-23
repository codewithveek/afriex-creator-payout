import { eq, and, isNull, sql, or } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { db } from '../../config/db';
import { orders } from '../../infra/database/schema';
import {
  blindIndex,
  encryptPii,
  decryptPii,
  hashToken,
  isEncryptedPii,
  normalizeEmail,
} from '../../shared/utils/encryption';

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type DecryptedOrder = Order & {
  /** Plaintext email for application use */
  customerEmailPlain: string;
  customerNamePlain: string;
};

function legacyEmailSha(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function decryptOrder(row: Order): DecryptedOrder {
  return {
    ...row,
    customerEmailPlain: decryptPii(row.customerEmail),
    customerNamePlain: decryptPii(row.customerName),
  };
}

export const ordersRepository = {
  async create(input: {
    productId: string;
    creatorId: string;
    customerId?: string | null;
    customerEmail: string;
    customerName: string;
    amount: string;
    currency: Order['currency'];
    paymentSessionId: string;
  }): Promise<DecryptedOrder> {
    const email = normalizeEmail(input.customerEmail);
    const [row] = await db
      .insert(orders)
      .values({
        productId: input.productId,
        creatorId: input.creatorId,
        customerId: input.customerId ?? null,
        customerEmail: encryptPii(email),
        customerEmailHash: blindIndex(email, 'email'),
        customerName: encryptPii(input.customerName.trim()),
        amount: input.amount,
        currency: input.currency,
        paymentSessionId: input.paymentSessionId,
      })
      .returning();
    return decryptOrder(row!);
  },

  async findById(id: string): Promise<DecryptedOrder | undefined> {
    const row = await db.query.orders.findFirst({ where: eq(orders.id, id) });
    return row ? decryptOrder(row) : undefined;
  },

  async findByPaymentSessionId(sessionId: string): Promise<DecryptedOrder | undefined> {
    const row = await db.query.orders.findFirst({
      where: eq(orders.paymentSessionId, sessionId),
    });
    return row ? decryptOrder(row) : undefined;
  },

  async findByCreatorId(
    creatorId: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: DecryptedOrder[]; total: number }> {
    const rows = await db.query.orders.findMany({
      where: eq(orders.creatorId, creatorId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      offset,
      limit,
    });
    const total = await db.$count(orders, eq(orders.creatorId, creatorId));
    return { rows: rows.map(decryptOrder), total };
  },

  async findByCustomerEmail(
    email: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: DecryptedOrder[]; total: number }> {
    const normalized = normalizeEmail(email);
    const hash = blindIndex(normalized, 'email');
    const legacy = legacyEmailSha(normalized);

    const rows = await db.query.orders.findMany({
      where: or(eq(orders.customerEmailHash, hash), eq(orders.customerEmailHash, legacy)),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { product: true },
      offset,
      limit,
    });

    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(or(eq(orders.customerEmailHash, hash), eq(orders.customerEmailHash, legacy)));

    return { rows: rows.map(decryptOrder), total: totalRows[0]?.count ?? 0 };
  },

  async findByCustomerId(
    customerId: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: DecryptedOrder[]; total: number }> {
    const rows = await db.query.orders.findMany({
      where: eq(orders.customerId, customerId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { product: true },
      offset,
      limit,
    });
    const total = await db.$count(orders, eq(orders.customerId, customerId));
    return { rows: rows.map(decryptOrder), total };
  },

  async linkGuestOrdersByEmail(email: string, customerId: string): Promise<number> {
    const normalized = normalizeEmail(email);
    const hash = blindIndex(normalized, 'email');
    const legacy = legacyEmailSha(normalized);

    const result = await db
      .update(orders)
      .set({ customerId, updatedAt: new Date() })
      .where(
        and(
          or(eq(orders.customerEmailHash, hash), eq(orders.customerEmailHash, legacy)),
          isNull(orders.customerId),
        ),
      )
      .returning({ id: orders.id });
    return result.length;
  },

  async markCompleted(
    id: string,
    rawDownloadToken: string,
    downloadTokenExpiresAt: Date,
  ): Promise<void> {
    await db
      .update(orders)
      .set({
        status: 'COMPLETED',
        downloadTokenHash: hashToken(rawDownloadToken),
        downloadTokenEncrypted: encryptPii(rawDownloadToken),
        downloadTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  },

  async renewDownloadToken(
    id: string,
    rawDownloadToken: string,
    downloadTokenExpiresAt: Date,
  ): Promise<void> {
    await db
      .update(orders)
      .set({
        downloadTokenHash: hashToken(rawDownloadToken),
        downloadTokenEncrypted: encryptPii(rawDownloadToken),
        downloadTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  },

  async markFailed(id: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(eq(orders.id, id));
  },

  async verifyDownloadTokenHash(orderId: string, rawToken: string): Promise<DecryptedOrder | undefined> {
    const order = await this.findById(orderId);
    if (!order) return undefined;
    const presented = hashToken(rawToken);
    if (order.downloadTokenHash && order.downloadTokenHash === presented) {
      return order;
    }
    // Legacy path: token only lived in encrypted/plaintext field
    if (order.downloadTokenEncrypted) {
      try {
        const raw = decryptPii(order.downloadTokenEncrypted);
        if (raw === rawToken) return order;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },

  getRawDownloadToken(order: DecryptedOrder): string | null {
    if (!order.downloadTokenEncrypted) return null;
    try {
      return decryptPii(order.downloadTokenEncrypted);
    } catch {
      return null;
    }
  },

  /** Upgrade legacy plaintext order PII when encountered. */
  async upgradeOrderPii(order: DecryptedOrder): Promise<void> {
    if (isEncryptedPii(order.customerEmail)) return;
    await db
      .update(orders)
      .set({
        customerEmail: encryptPii(order.customerEmailPlain),
        customerEmailHash: blindIndex(order.customerEmailPlain, 'email'),
        customerName: encryptPii(order.customerNamePlain),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  },
};
